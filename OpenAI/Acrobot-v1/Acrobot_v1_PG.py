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


class RLAgent:

    def __init__(self, env, load_weights=None):
        global PARENT_DIR, RUN_ID

        self.batch_size = 32
        self.learning_rate = 0.001

        self.state_size = env.observation_space.shape[0]
        self.action_size = env.action_space.n

        self.sess = tf.compat.v1.Session()
        if load_weights is not None:
            self.loadModel(load_weights)
        else:
            self.build_model()

        self.summary_writer = tf.compat.v1.summary.FileWriter(os.path.join(PARENT_DIR, 'data', 'tensorboard', RUN_ID))
        self.summary_writer.add_graph(self.sess.graph)
        self.merged_summary = tf.summary.merge_all()

        # Print Model Info
        print("\nINFO")
        print("-------------------")
        print("State Size  : {}".format(self.state_size))
        print("Action Size : {:2d}".format(self.action_size))
        print("-------------------")

    # Define the layers of the neural network model
    def build_model(self):
        self.input_ph = tf.compat.v1.placeholder(tf.float32, (None, self.state_size), name="Input")
        with tf.name_scope("Layer_1"):
            weights = tf.compat.v1.Variable(tf.random.normal([self.state_size, 48]))
            biases = tf.compat.v1.Variable(tf.zeros([48]))

            tf.compat.v1.summary.histogram("weights", weights)
            tf.compat.v1.summary.histogram("biases", biases)

            layer1_out = tf.add(tf.matmul(self.input_ph, weights), biases)
            layer1_out = tf.nn.relu(layer1_out)

        with tf.name_scope("Layer_2"):
            weights = tf.compat.v1.Variable(tf.random.normal([48, 20]))
            biases = tf.compat.v1.Variable(tf.zeros([20]))

            tf.compat.v1.summary.histogram("weights", weights)
            tf.compat.v1.summary.histogram("biases", biases)

            layer2_out = tf.add(tf.matmul(layer1_out, weights), biases)
            layer2_out = tf.nn.relu(layer2_out)
        with tf.name_scope("Output"):
            weights = tf.compat.v1.Variable(tf.random.normal([20, self.action_size]))
            biases = tf.compat.v1.Variable(tf.zeros([self.action_size]))

            tf.compat.v1.summary.histogram("weights", weights)
            tf.compat.v1.summary.histogram("biases", biases)

            logits = tf.add(tf.matmul(layer2_out, weights), biases)

        self.actions = tf.squeeze(tf.random.categorical(logits=logits, num_samples=1), axis=1)

        with tf.name_scope("Loss"):
            self.weights_ph = tf.compat.v1.placeholder(shape=(None,), dtype=tf.float32)
            self.action_ph = tf.compat.v1.placeholder(shape=(None,), dtype=tf.int32)
            action_masks = tf.one_hot(self.action_ph, self.action_size)
            log_probs = tf.reduce_sum(action_masks * tf.nn.log_softmax(logits), axis=1)
            self.loss = -tf.reduce_mean(self.weights_ph * log_probs)

        with tf.name_scope("Optimizer"):
            self.optimizer = tf.compat.v1.train.AdamOptimizer(learning_rate=self.learning_rate).minimize(self.loss)

        self.sess.run(tf.compat.v1.global_variables_initializer())

    # Save the model
    def saveModel(self):
        global PARENT_DIR, RUN_ID
        saver = tf.compat.v1.train.Saver()
        checkpoint_file = os.path.join(PARENT_DIR, 'data\\saved_models', 'model_{}.ckpt'.format(RUN_ID))
        save_path = saver.save(self.sess, checkpoint_file)
        print("Model saved in path: {}".format(save_path))

    # Save the model
    def loadModel(self, file_name):
        global PARENT_DIR, GAME
        checkpoint_file = os.path.join(PARENT_DIR, 'data\\saved_models', file_name)
        if os.path.isfile(checkpoint_file):
            saver.restore(sess, checkpoint_file)
            print("Loaded model from disk")
            return True
        else:
            print("Could not find file. Initializing the model")
            return self.build_model()
            return False

    # Get best action from policy
    def getAction(self, state):
        state = np.reshape(state, (1, self.state_size))
        action = self.sess.run(self.actions, {self.input_ph: state})
        return action[0]

    # Train the model parameters
    def trainModel(self, episode, states, actions, rewards):

        total_loss = 0
        episode_steps = len(states)
        total_reward = sum(rewards)
        weights = [total_reward] * episode_steps

        for i in range(0, episode_steps, self.batch_size):
            batch_states = np.array(states[i:i + self.batch_size])
            batch_actions = np.array(actions[i:i + self.batch_size])
            batch_weights = np.array(weights[i:i + self.batch_size])
            batch_loss, _ = self.sess.run(
                [self.loss, self.optimizer],
                feed_dict={
                    self.input_ph: batch_states,
                    self.action_ph: batch_actions,
                    self.weights_ph: batch_weights
                }
            )
            total_loss += batch_loss

        self.plotMetrics(episode, total_loss, total_reward, episode_steps)

    def plotMetrics(self, episode, total_loss, total_reward, episode_steps):
        summary = tf.compat.v1.Summary()
        summary.value.add(tag='Loss', simple_value=total_loss)
        summary.value.add(tag='Reward', simple_value=total_reward)
        summary.value.add(tag='Frames', simple_value=episode_steps)
        self.summary_writer.add_summary(summary, episode)

        if episode % 10 == 0:
            episode_summary = self.sess.run(self.merged_summary)
            self.summary_writer.add_summary(episode_summary, episode)


# Initialize the program and create necessary folders


def init(PARENT_DIR, GAME):

    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

    # Create the necessary folders
    data_folder = os.path.join(PARENT_DIR, 'data')
    if not os.path.exists(data_folder):
        os.makedirs(data_folder)

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

    return (env, agent)


# ~~~ Main Code ~~~


# Global Variables and Constants
GAME = 'Acrobot-v1'
MAX_EPISODES = 1000
MAX_FRAMES = 10000
RUN_ID = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))

env, agent = init(PARENT_DIR, GAME)
try:

    for episode in range(MAX_EPISODES):
        # make some empty lists for logging.
        episode_states = []
        episode_actions = []
        episode_rewards = []
        state = env.reset()
        for frame in range(MAX_FRAMES):
            # env.render()
            action = agent.getAction(state)
            next_state, reward, done, info = env.step(action)
            episode_states.append(state)
            episode_actions.append(action)
            episode_rewards.append(reward)
            state = next_state

            if done:
                print("Episode: {:4d} | Total Reward: {:+9.3f} | Frames : {:3d}".format(episode, sum(episode_rewards), frame))
                break

        agent.trainModel(episode, episode_states, episode_actions, episode_rewards)


except Exception as e:
    print(str(e))
    traceback.print_exc()
finally:
    print("Done")
    agent.saveModel()
    env.close()
