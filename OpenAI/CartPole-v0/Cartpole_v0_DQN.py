import collections
import datetime
import gym
import matplotlib.pyplot as plt
import numpy as np
import os
import random
import sys
import tensorflow as tf

from tensorflow import keras


class RLAgent:

    def __init__(self, state_size, action_size):
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
        self.model = self.build_model()

    # Define the layers of the neural network model
    def build_model(self):
        model = keras.models.Sequential()
        model.add(keras.layers.Dense(32, activation="relu", input_shape=self.state_size))
        model.add(keras.layers.Dense(32, activation="relu"))
        model.add(keras.layers.Dense(action_size))
        model.compile(
            optimizer=keras.optimizers.Adam(lr=self.learning_rate),
            loss=keras.losses.MeanSquaredError(),
            metrics=[
                tf.keras.metrics.Accuracy(),
                tf.keras.metrics.BinaryAccuracy()
            ])
        model.summary()
        return model

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
        global PARENT_DIR, RUN_ID

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

        tensorboard_callback = keras.callbacks.TensorBoard(log_dir=os.path.join(PARENT_DIR, 'data\\TensorBoard', RUN_ID),
                                                           write_grads=True,
                                                           write_images=True,
                                                           update_freq='batch')

        self.model.fit(
            np.array(batch_train_x),
            np.array(batch_train_y),
            batch_size=len(batch_train_x),
            workers=4,
            use_multiprocessing=True,
            callbacks=[tensorboard_callback],
            verbose=False)
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)


def plotMetrics():
    color = 'tab:red'
    ax1.clear()
    ax1.set_ylabel('Score', color=color)
    ax1.plot(episode_history[-200:], reward_history[-200:], color=color)
    ax1.set_ylim([-10, 220])
    ax2.tick_params(axis='y', labelcolor=color)

    color = 'tab:blue'
    ax2.clear()
    ax2.set_ylabel('Epsilon', color=color)
    ax2.plot(episode_history[-200:], epsilon_history[-200:], color=color)
    ax2.set_ylim([0, 1.1])
    ax2.tick_params(axis='y', labelcolor=color)

    if episode % 10 == 0:
        plt.pause(0.05)


# ~~~ Main Code ~~~
GAME = 'CartPole-v0'
MAX_EPISODES = 5000
MAX_FRAMES = 1000
RUN_ID = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))

env = gym.make(GAME)
env = gym.wrappers.Monitor(env, os.path.join(PARENT_DIR, 'data/recordings/'), force=True)
state_size = env.observation_space.shape
action_size = env.action_space.n
agent = RLAgent(state_size, action_size)

print("\n\nINFO\n--------------")
print("State Size  : {}".format(state_size))
print("Action Size : {:2d}".format(action_size))


reward_history = []
epsilon_history = []
episode_history = []
print("Starting : ")
for episode in range(MAX_EPISODES):

    cum_reward = 0

    state = env.reset()
    for frame in range(MAX_FRAMES):
        action = agent.getAction(state)
        next_state, reward, done, info = env.step(action)
        if done and frame != 199:
            reward -= 10

        cum_reward += reward
        agent.saveExperience(state, action, reward, next_state)
        state = next_state

        if done:
            episode_history.append(episode)
            epsilon_history.append(agent.epsilon)
            reward_history.append(cum_reward)
            print("Episode:{:3d} | Frames : {:3d} | Total Reward: {:7.3f} | Epsilon:{:7.4f}".format(episode, frame, cum_reward, agent.epsilon))
            break

    if len(agent.replay_buffer) >= agent.batch_size:
        agent.trainModel()

env.close()
