import collections
import datetime
import glob
import gym
import matplotlib.pyplot as plt
import numpy as np
import os
import random
import seaborn as sns
import sys
import time
import tensorflow as tf
import traceback


class RLAgent:

    def __init__(self, env, maximizer=True, load_weights=None):

        self.epsilon = 1.0
        self.epsilon_decay = 0.996
        self.epsilon_min = 0.01
        self.gamma = 0.99
        self.learning_rate = 0.001
        self.learning_rate_decay = 0.01
        self.max_tau = 500
        self.tau = 0

        self.batch_size = 64

        self.replay_buffer = collections.deque(maxlen=1000000)

        if isinstance(env.observation_space, gym.spaces.Box):
            self.state_size = env.observation_space.shape
        elif isinstance(env.observation_space, gym.spaces.Discrete):
            self.state_size = env.observation_space.n
        else:
            raise Exception('Dont not know how to handle observation space of type ', type(env.observation_space))

        if isinstance(env.action_space, gym.spaces.Box):
            self.action_size = env.action_space.shape
        elif isinstance(env.action_space, gym.spaces.Discrete):
            self.action_size = env.action_space.n
        else:
            raise Exception('Dont not know how to handle action space of type ', type(env.action_space))

        if load_weights is not None:
            self.model = self.loadModel(load_weights)
        else:
            self.model = self.build_model()
        self.updateTargetNetwork()
        print("\nINFO")
        print("-------------------")
        print("State Size  : {}".format(self.state_size))
        print("Action Size : {}".format(self.action_size))
        print("-------------------")

    # Update the target network
    def updateTargetNetwork(self):
        print("Updating Target Network")
        self.target_model = tf.keras.models.clone_model(self.model)
        self.target_model.set_weights(self.model.get_weights())
        self.tau = 0

    # Define the layers of the neural network model
    def build_model(self):
        model = tf.keras.models.Sequential()
        model.add(tf.keras.layers.Dense(150, activation="relu", input_shape=self.state_size))
        # model.add(tf.keras.layers.BatchNormalization())
        model.add(tf.keras.layers.Dense(120, activation="relu"))
        # model.add(tf.keras.layers.BatchNormalization())
        model.add(tf.keras.layers.Dense(self.action_size, activation='linear'))
        model.compile(
            optimizer=tf.keras.optimizers.Adam(lr=self.learning_rate),
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
            return tf.keras.models.load_model(weights_file)
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
        self.replay_buffer.append((state, action, reward, next_state, done))

    # Train the model parameters
    def trainModel(self):

        global PARENT_DIR, RUN_ID

        if len(self.replay_buffer) < self.batch_size:
            return 0

        self.tau += 1
        if self.tau > self.max_tau:
            self.updateTargetNetwork()

        minibatch = random.sample(self.replay_buffer, self.batch_size)
        batch_train_x = []
        batch_train_y = []

        states = np.array([b[0] for b in minibatch])
        actions = np.array([b[1] for b in minibatch])
        rewards = np.array([b[2] for b in minibatch])
        next_states = np.array([b[3] for b in minibatch])
        dones = np.array([b[4] for b in minibatch])

        # targets = rewards + self.gamma*(np.amax(self.model.predict_on_batch(next_states), axis=1))*(1-dones)
        # targets_full = self.model.predict_on_batch(states)
        # ind = np.array([i for i in range(self.batch_size)])
        # targets_full[[ind], [actions]] = targets

        next_state_values = np.amax(self.target_model.predict_on_batch(next_states), axis=1)
        target_values = self.model.predict_on_batch(states)

        for i in range(len(minibatch)):
            true_action_value = rewards[i] + self.gamma * next_state_values[i] * (1-dones[i])
            target_values[i][actions[i]] = true_action_value

        history = self.model.fit(
            states,
            target_values,
            epochs=1,
            verbose=False)

        agent.epsilon = max(agent.epsilon_min, agent.epsilon * agent.epsilon_decay)

        return history.history['loss'][0]


# Initialize the program and create necessary folders
def init(PARENT_DIR, GAME, SAVED_MODEL=None):

    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    tf.compat.v1.disable_eager_execution()

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
    # env = gym.wrappers.Monitor(env, os.path.join(PARENT_DIR, 'data/recordings/', RUN_ID), force=True)

    agent = RLAgent(env, maximizer=True, load_weights=SAVED_MODEL)
    summary_writer = tf.compat.v1.summary.FileWriter(os.path.join(tensorboard_folder, RUN_ID))

    return (env, agent, summary_writer)


# Plot the metrics to Tensorboard for easier visualization
def plotMetrics(summary_writer, episode, epsilon, train_loss, max_step, total_reward, average_reward):

    summary = tf.compat.v1.Summary()
    summary.value.add(tag='Epsilon', simple_value=epsilon)
    summary.value.add(tag='Loss', simple_value=train_loss)
    summary.value.add(tag='Steps', simple_value=max_step)
    summary.value.add(tag='Reward', simple_value=total_reward)
    summary.value.add(tag='Reward Average (100)', simple_value=np.mean(average_reward))
    summary_writer.add_summary(summary, episode)

# ~~~ MAIN CODE ~~~

# Global Variables and Constants


GAME = 'LunarLander-v2'
MAX_EPISODES = 1000
MAX_STEPS = 3000
RENDER = False


RUN_ID = 'Double_DQN_tau_500'  # datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODEL = None
# SAVED_MODEL = max(glob.glob(os.path.join(PARENT_DIR, 'data', 'saved_models')+"/*"), key=os.path.getctime)     # Returns Latest File

env, agent, summary_writer = init(PARENT_DIR, GAME, SAVED_MODEL)
clock = time.time()
try:
    # Start the Simulation
    average_reward = collections.deque(maxlen=100)
    for episode in range(MAX_EPISODES):
        total_loss = 0
        max_step = 0
        total_reward = 0

        state = env.reset()
        if RENDER:
            env.render()
        for step in range(MAX_STEPS):
            action = agent.getAction(state)
            next_state, reward, done, info = env.step(action)
            agent.saveExperience(state, action, reward, next_state, done)

            state = next_state
            total_reward += reward

            train_loss = agent.trainModel()
            total_loss += train_loss

            if RENDER:
                env.render()

            if done:
                max_step = step
                average_reward.append(total_reward)
                print("Episode: {:4d} | Total Reward: {:+9.3f} | Frames : {:3d} |"
                      .format(episode, total_reward, max_step))
                break

        if not RENDER:
            plotMetrics(summary_writer, episode, agent.epsilon, total_loss, max_step, total_reward, average_reward)

    env.close()
except Exception as e:
    print(str(e))
    traceback.print_exc()
finally:
    print("Done. Time Taken : {:.2f}".format(time.time()-clock))
    agent.saveModel()
    env.close()
