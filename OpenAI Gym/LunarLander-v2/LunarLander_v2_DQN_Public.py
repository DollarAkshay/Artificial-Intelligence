# Landing pad is always at coordinates (0,0). Coordinates are the first
# two numbers in state vector. Reward for moving from the top of the screen
# to landing pad and zero speed is about 100..140 points. If lander moves
# away from landing pad it loses reward back. Episode finishes if the lander
# crashes or comes to rest, receiving additional -100 or +100 points.
# Each leg ground contact is +10. Firing main engine is -0.3 points each frame.
# Solved is 200 points. Landing outside landing pad is possible. Fuel is
# infinite, so an agent can learn to fly and then land on its first attempt.
# Four discrete actions available: do nothing, fire left orientation engine,
# fire main engine, fire right orientation engine.

import collections
import gym
import random
from keras import Sequential
from collections import deque
from keras.layers import Dense
from keras.optimizers import adam
import matplotlib.pyplot as plt
from keras.activations import relu, linear
import os
import tensorflow as tf

import numpy as np
env = gym.make('LunarLander-v2')
env.seed(0)
np.random.seed(0)


class DQN:

    """ Implementation of deep q learning algorithm """

    def __init__(self, action_space, state_space):

        self.epsilon = 1.0
        self.epsilon_decay = .996
        self.epsilon_min = .01
        self.gamma = .99
        self.lr = 0.001

        self.batch_size = 64

        self.action_space = action_space
        self.state_space = state_space

        self.memory = deque(maxlen=1000000)
        self.model = self.build_model()

    def build_model(self):

        model = Sequential()
        model.add(Dense(150, input_dim=self.state_space, activation=relu))
        model.add(Dense(120, activation=relu))
        model.add(Dense(self.action_space, activation=linear))
        model.compile(loss='mse', optimizer=adam(lr=self.lr))
        return model

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def act(self, state):

        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_space)
        act_values = self.model.predict(state)
        return np.argmax(act_values[0])

    def replay(self):

        if len(self.memory) < self.batch_size:
            return 0

        minibatch = random.sample(self.memory, self.batch_size)
        states = np.array([i[0] for i in minibatch])
        actions = np.array([i[1] for i in minibatch])
        rewards = np.array([i[2] for i in minibatch])
        next_states = np.array([i[3] for i in minibatch])
        dones = np.array([i[4] for i in minibatch])

        states = np.squeeze(states)
        next_states = np.squeeze(next_states)

        targets = rewards + self.gamma*(np.amax(self.model.predict_on_batch(next_states), axis=1))*(1-dones)
        targets_full = self.model.predict_on_batch(states)
        ind = np.array([i for i in range(self.batch_size)])
        targets_full[[ind], [actions]] = targets

        history = self.model.fit(states, targets_full, epochs=1, verbose=0)
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

        return history.history['loss'][0]


# Plot the metrics to Tensorboard for easier visualization
def plotMetrics(episode, epsilon, train_loss, max_step, total_reward, average_reward):

    global summary_writer

    summary = tf.compat.v1.Summary()
    summary.value.add(tag='Epsilon', simple_value=epsilon)
    summary.value.add(tag='Loss', simple_value=train_loss)
    summary.value.add(tag='Steps', simple_value=max_step)
    summary.value.add(tag='Reward', simple_value=total_reward)
    summary.value.add(tag='Reward Average (100)', simple_value=np.mean(average_reward))
    summary_writer.add_summary(summary, episode)


def train_dqn(episode):

    loss = []
    agent = DQN(env.action_space.n, env.observation_space.shape[0])
    average_reward = collections.deque(maxlen=100)
    for e in range(episode):
        state = env.reset()
        state = np.reshape(state, (1, 8))
        max_steps = 3000

        total_loss = 0
        max_step = 0
        total_reward = 0

        for i in range(max_steps):
            action = agent.act(state)
            # env.render()
            next_state, reward, done, _ = env.step(action)
            total_reward += reward
            next_state = np.reshape(next_state, (1, 8))
            agent.remember(state, action, reward, next_state, done)
            state = next_state
            total_loss += agent.replay()
            if done:
                max_step = i
                average_reward.append(total_reward)
                print("episode: {}/{}, Total Reward: {}".format(e, episode, total_reward))
                break
        loss.append(total_reward)

        plotMetrics(e, agent.epsilon, total_loss, max_step, total_reward, average_reward)

        # Average score of last 100 episode
        is_solved = np.mean(loss[-100:])
        if is_solved > 200:
            print('\n Task Completed! \n')
            break
        print("Average over last 100 episode: {0:.2f} \n".format(is_solved))
    return loss


tf.compat.v1.disable_eager_execution()
RUN_ID = 'Public_DQN_2'
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))
tensorboard_folder = os.path.join(PARENT_DIR, 'data', 'tensorboard')
summary_writer = tf.compat.v1.summary.FileWriter(os.path.join(tensorboard_folder, RUN_ID))


if __name__ == '__main__':

    print(env.observation_space)
    print(env.action_space)
    episodes = 400
    loss = train_dqn(episodes)
    plt.plot([i+1 for i in range(0, len(loss), 2)], loss[::2])
    plt.show()
