import collections
import datetime
import glob
import gym
import gym_tictactoe
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
        self.epsilon_decay = 0.9975
        self.epsilon_min = 0.001
        self.gamma = 0.99
        self.learning_rate = 0.00002
        self.learning_rate_decay = 0.01
        self.max_tau = 1000
        self.tau = 0

        self.batch_size = 128

        self.replay_buffer = collections.deque(maxlen=100000)
        self.state_size = [env.observation_space.n]
        self.action_size = env.action_space['pos'].n
        self.maximizer = maximizer
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
        model.add(tf.keras.layers.Dense(36, activation="relu", input_shape=self.state_size))
        model.add(tf.keras.layers.Dense(42, activation="relu", input_shape=self.state_size))
        model.add(tf.keras.layers.Dense(36, activation="relu", input_shape=self.state_size))
        model.add(tf.keras.layers.Dense(self.action_size))
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
        state = np.reshape(state, (1, self.state_size[0]))
        next_state = np.reshape(next_state, (1, self.state_size[0]))
        self.replay_buffer.append((state, action, reward, next_state, done))

    # Train the model parameters
    def trainModel(self):

        global PARENT_DIR, RUN_ID

        self.tau += 1
        if self.tau > self.max_tau:
            self.updateTargetNetwork()

        sample_size = min(self.batch_size, len(self.replay_buffer))
        minibatch = random.sample(self.replay_buffer, sample_size)
        batch_train_x = []
        batch_train_y = []

        state_list = np.array([b[0][0] for b in minibatch])
        next_state_list = np.array([b[3][0] for b in minibatch])

        next_state_value_list = np.amax(self.target_model.predict(next_state_list), axis=1)
        target_value_list = self.model.predict(state_list)

        for i, (state, action, reward, next_state, done) in enumerate(minibatch):
            next_state_value = 0
            if not done:
                next_state_value = next_state_value_list[i]

            action_value = reward + self.gamma * next_state_value
            target_values = target_value_list[i]
            target_values[action] = action_value

            batch_train_x.append(state[0])
            batch_train_y.append(target_values)

        # log_dir = os.path.join(PARENT_DIR, 'data', 'tensorboard', RUN_ID)
        # tboard_callback = tf.keras.callbacks.TensorBoard(log_dir=log_dir,
        #                                                  histogram_freq=1,
        #                                                  profile_batch=1)

        history = self.model.fit(
            np.array(batch_train_x),
            np.array(batch_train_y),
            batch_size=len(batch_train_x),
            epochs=5,
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
    summary.value.add(tag='Reward P0', simple_value=total_reward[0])
    summary.value.add(tag='Reward P1', simple_value=-total_reward[1])
    summary.value.add(tag='Reward Average (100) P0', simple_value=np.mean(average_reward[0]))
    summary.value.add(tag='Reward Average (100) P1', simple_value=-np.mean(average_reward[1]))
    summary_writer.add_summary(summary, episode)


def randomValidAction(state):

    valid_moves = []
    for i in range(9):
        if state[i] == 0 and state[i + 9] == 0:
            valid_moves.append(i)

    return random.choice(valid_moves)


# ~~~ MAIN CODE ~~~

# Global Variables and Constants

GAME = 'tictactoe-v0'
MAX_EPISODES = 15000
MAX_STEPS = 100
RENDER = False


RUN_ID = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODEL = None
# SAVED_MODEL = max(glob.glob(os.path.join(PARENT_DIR, 'data', 'saved_models')+"/*"), key=os.path.getctime)     # Returns Latest File

env, agent, summary_writer = init(PARENT_DIR, GAME, SAVED_MODEL)
clock = time.time()
try:
    # Start the Simulation
    average_reward = [collections.deque(maxlen=100), collections.deque(maxlen=100)]
    for episode in range(MAX_EPISODES):
        total_loss = 0
        max_step = 0
        total_reward = [0, 0]

        state = env.reset()
        if RENDER:
            env.render()
        for step in range(MAX_STEPS):

            action = None
            if env.player_turn == 0:
                action = agent.getAction(state)
                action_formated = {'player': env.player_turn, 'pos': action}
                next_state, reward, done, info = env.step(action_formated)
                agent.saveExperience(state, action, reward[0], next_state, done)

                state = next_state
                total_reward[0] += reward[0]
                total_reward[1] += reward[1]

                train_loss = agent.trainModel()
                total_loss += train_loss

            else:
                action = randomValidAction(state)
                action_formated = {'player': env.player_turn, 'pos': action}
                next_state, reward, done, info = env.step(action_formated)

                state = next_state
                total_reward[0] += reward[0]
                total_reward[1] += reward[1]

            if RENDER:
                env.render()
                time.sleep(1)

            print(done)

            if done:
                max_step = step
                average_reward[0].append(total_reward[0])
                average_reward[1].append(total_reward[1])
                print("Episode: {:4d} | Total Reward P0: {:+9.3f} | Total Reward P1: {:+9.3f} Frames : {:3d} |"
                      .format(episode, total_reward[0], -total_reward[1], max_step))
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
