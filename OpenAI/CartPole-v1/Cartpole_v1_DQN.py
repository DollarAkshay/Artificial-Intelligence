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
from tensorflow import keras


class RLAgent:

    def __init__(self, state_size, action_size, load_weights=False):
        self.epsilon = 1.0
        self.epsilon_decay = 0.995
        self.epsilon_min = 0.01
        self.gamma = 0.95
        self.learning_rate = 0.001
        self.learning_rate_decay = 0.01

        self.batch_size = 32

        self.replay_buffer = collections.deque(maxlen=100000)
        self.state_size = state_size
        self.action_size = action_size
        if load_weights:
            self.model = self.loadModel()
        else:
            self.model = self.build_model()

    # Define the layers of the neural network model
    def build_model(self):
        model = keras.models.Sequential()
        model.add(keras.layers.Dense(32, activation="relu", input_shape=self.state_size))
        model.add(keras.layers.Dense(32, activation="relu"))
        model.add(keras.layers.Dense(action_size))
        model.compile(
            optimizer=keras.optimizers.Adam(lr=self.learning_rate),
            loss='mse')
        model.summary()
        return model

    # Save the model
    def saveModel(self):
        global PARENT_DIR, GAME
        self.model.save(os.path.join(PARENT_DIR, 'data', GAME + '_model_weights.h5'))

    # Save the model
    def loadModel(self):
        global PARENT_DIR, GAME
        weights_file = os.path.join(PARENT_DIR, 'data', GAME + '_model_weights.h5')
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
    def saveExperience(self, state, action, reward, next_state):
        state = np.reshape(state, (1, self.state_size[0]))
        next_state = np.reshape(next_state, (1, self.state_size[0]))
        self.replay_buffer.append((state, action, reward, next_state))

    # Train the model parameters
    def trainModel(self):
        minibatch = random.sample(self.replay_buffer, min(self.batch_size, len(self.replay_buffer)))
        batch_train_x = []
        batch_train_y = []

        for state, action, reward, next_state in minibatch:
            next_state_value = 0
            if next_state is not None:
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
            verbose=False)

        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
        return history.history['loss'][0]


def plotMetrics(episode_history, reward_history, loss_history):

    global fig, axes

    axes[0].clear()
    axes[0].plot(episode_history[-200:], reward_history[-200:], color='#44bb66')
    axes[0].set_ylim([-10, 510])

    axes[1].clear()
    axes[1].plot(episode_history[-200:], loss_history[-200:], color='#ff4444')
    axes[1].set_ylim([0, 7])

    plt.tight_layout()
    plt.pause(0.05)


# ~~~ Main Code ~~~
GAME = 'CartPole-v1'
MAX_EPISODES = 5000
MAX_FRAMES = 1000
RUN_ID = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))

env = gym.make(GAME)
env = gym.wrappers.Monitor(env, os.path.join(PARENT_DIR, 'data/recordings/'), force=True)
state_size = env.observation_space.shape
action_size = env.action_space.n
agent = RLAgent(state_size, action_size, load_weights=True)

print("\n\nINFO\n--------------")
print("State Size  : {}".format(state_size))
print("Action Size : {:2d}".format(action_size))

fig, axes = plt.subplots(nrows=2, ncols=1)
episode_history = []
reward_history = []
loss_history = []

try:
    print("Starting : ")
    for episode in range(MAX_EPISODES):

        cum_reward = 0
        state = env.reset()

        for frame in range(MAX_FRAMES):
            action = agent.getAction(state)
            next_state, reward, done, info = env.step(action)
            if done and frame < 499:
                reward -= 10

            cum_reward += reward
            agent.saveExperience(state, action, reward, next_state)
            state = next_state

            if done:
                episode_history.append(episode)
                reward_history.append(cum_reward)
                print("Episode:{:3d} | Frames : {:3d} | Total Reward: {:7.3f} | Epsilon:{:7.4f}".format(episode, frame, cum_reward, agent.epsilon))
                break

        if len(agent.replay_buffer) >= agent.batch_size:
            train_loss = agent.trainModel()
            loss_history.append(train_loss)
        else:
            loss_history.append(0)

        if episode % 50 == 0:
            plotMetrics(episode_history, reward_history, loss_history)

except Exception as e:
    print(str(e))
finally:
    print("Done")
    agent.saveModel()
    env.close()
    plt.show()
