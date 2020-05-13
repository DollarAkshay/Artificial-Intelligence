import collections
import datetime
import gym
import matplotlib.pyplot as plt
import numpy as np
import os
import random
import seaborn as sns
import sys
import tensorflow as tf
import time
import traceback
from tensorflow import keras


class RLAgent:

    def __init__(self, env, load_weights=None):
        self.epsilon = 1.0
        self.epsilon_decay = 0.9995
        self.epsilon_min = 0.01
        self.gamma = 0.95
        self.learning_rate = 0.001
        self.learning_rate_decay = 0.01

        self.batch_size = 1024

        self.replay_buffer = collections.deque(maxlen=100000)
        self.state_size = env.observation_space.shape
        self.action_size = env.action_space.n
        if load_weights is not None:
            self.model = self.loadModel(load_weights)
        else:
            self.model = self.build_model()

        print("\nINFO")
        print("-------------------")
        print("State Size  : {}".format(self.state_size))
        print("Action Size : {:2d}".format(self.action_size))
        print("-------------------")

    # Define the layers of the neural network model
    def build_model(self):
        model = keras.models.Sequential()
        model.add(keras.layers.Dense(20, activation="relu", input_shape=self.state_size))
        model.add(keras.layers.Dense(12, activation="relu"))
        model.add(keras.layers.Dense(self.action_size))
        model.compile(
            optimizer=keras.optimizers.Adam(lr=self.learning_rate),
            loss='mse')
        model.summary()
        return model

    # Save the model
    def saveModel(self):
        global PARENT_DIR, RUN_ID
        self.model.save(os.path.join(PARENT_DIR, 'data\\saved_models', 'model_{}.h5'.format(RUN_ID)))

    # Save the model
    def loadModel(self, file_name):
        global PARENT_DIR, GAME
        weights_file = os.path.join(PARENT_DIR, 'data\\saved_models', file_name)
        if os.path.isfile(weights_file):
            print("Loaded model from disk")
            self.epsilon = self.epsilon_min
            return keras.models.load_model(weights_file)
        else:
            print("Could not find file. Initializing the model")
            return self.build_model()

    # Get best action from policy
    def getAction(self, state):
        state = np.reshape(state, (1, self.state_size[0]))
        if np.random.rand() <= self.epsilon:
            # Exploration
            return np.random.randint(self.action_size)
        else:
            # Exploitation
            output = self.model.predict(state)
            return np.argmax(output)

    # Save an experience for training during a later time
    def saveExperience(self, state, action, reward, next_state, done):
        state = np.reshape(state, (1, self.state_size[0]))
        next_state = np.reshape(next_state, (1, self.state_size[0]))
        self.replay_buffer.append((state, action, reward, next_state, done))

    # Train the model parameters
    def trainModel(self):
        if len(agent.replay_buffer) < agent.batch_size:
            return 0

        minibatch = random.sample(self.replay_buffer, min(self.batch_size, len(self.replay_buffer)))
        batch_train_x = []
        batch_train_y = []

        for state, action, reward, next_state, done in minibatch:
            next_state_value = 0
            if not done:
                next_state_value = np.max(self.model.predict(next_state))

            action_value = reward + self.gamma * next_state_value
            target_values = self.model.predict(state)
            target_values[0][action] = action_value

            batch_train_x.append(state[0])
            batch_train_y.append(target_values[0])

        history = self.model.fit(
            np.array(batch_train_x),
            np.array(batch_train_y),
            batch_size=len(batch_train_x),
            epochs=1,
            verbose=False)
        agent.epsilon = max(agent.epsilon_min, agent.epsilon * agent.epsilon_decay)

        return history.history['loss'][0]


# Initialize the program and create necessary folders
def init(PARENT_DIR, GAME):

    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

    # Create the necessary folders
    recordings_folder = os.path.join(PARENT_DIR, 'data', 'recordings')
    if not os.path.exists(recordings_folder):
        os.makedirs(recordings_folder)

    tensorboard_folder = os.path.join(PARENT_DIR, 'data', 'tensorboard')
    if not os.path.exists(tensorboard_folder):
        os.makedirs(tensorboard_folder)

    modles_folder = os.path.join(PARENT_DIR, 'data', 'saved_models')
    if not os.path.exists(modles_folder):
        os.makedirs(modles_folder)

    # Initialize environment, agent and logger
    env = gym.make(GAME)
    env = gym.wrappers.Monitor(env, os.path.join(PARENT_DIR, 'data/recordings/', RUN_ID), force=True)
    agent = RLAgent(env)
    summary_writer = tf.summary.FileWriter(os.path.join(PARENT_DIR, 'data', 'tensorboard', RUN_ID))

    return (env, agent, summary_writer)


# Plot the metrics to Tensorboard for easier visualization
def plotMetrics(summary_writer, episode, total_reward, average_reward, train_loss, max_frame, epsilon):

    summary = tf.Summary()
    summary.value.add(tag='Epsilon', simple_value=epsilon)
    summary.value.add(tag='Loss', simple_value=train_loss)
    summary.value.add(tag='Reward', simple_value=total_reward)
    summary.value.add(tag='Reward Average (100)', simple_value=average_reward)
    summary.value.add(tag='Frames', simple_value=max_frame)
    summary_writer.add_summary(summary, episode)


# ~~~ Main Code ~~~

# Global Variables and Constants
GAME = 'CartPole-v1'
MAX_EPISODES = 10000
MAX_FRAMES = 1000
RUN_ID = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))

env, agent, summary_writer = init(PARENT_DIR, GAME)
try:
    # Start the Simulation
    average_reward = collections.deque(maxlen=100)
    for episode in range(MAX_EPISODES):
        total_reward = 0
        total_loss = 0
        max_frame = 0
        state = env.reset()
        for frame in range(MAX_FRAMES):
            env.render()
            action = agent.getAction(state)
            next_state, reward, done, info = env.step(action)
            agent.saveExperience(state, action, reward, next_state, done)

            if frame % 4 == 0 and frame <= 100:
                train_loss = agent.trainModel()

            total_loss += train_loss
            total_reward += reward
            state = next_state
            if done:
                max_frame = frame
                average_reward.append(total_reward)
                print("Episode: {:4d} | Total Reward: {:+9.3f} | Frames : {:3d} | Epsilon: {:5.3f}".format(episode, total_reward, max_frame, agent.epsilon))
                break

        plotMetrics(summary_writer, episode, total_reward, np.mean(average_reward), total_loss, max_frame, agent.epsilon)

except Exception as e:
    print(str(e))
    traceback.print_exc()
finally:
    print("Done")
    agent.saveModel()
    env.close()

# Average Reward @ Step Value
# 100 @ 359
# 200 @ 862
