import collections
import datetime
import glob
import gym
import gym_bidding_game
import matplotlib.pyplot as plt
import numpy as np
import os
import random
import seaborn as sns
import sys
import tensorflow as tf
import timeit
import time
import tf_agents
import traceback

from tf_agents.networks import q_network
from tf_agents.environments import suite_gym, tf_py_environment


from utils import plotLearning


def linearAgent(obs):
    return np.floor(obs[0]/obs[3])


# ~~~ MAIN CODE ~~~
# Global Variables and Constants
GAME = 'BiddingGame-v0'
MAX_EPISODES = 10
MAX_STEPS = 10
RENDER = True
env_ = suite_gym.load(GAME)
env = tf_py_environment.TFPyEnvironment(env_)

q_net = tf_agents.networks.q_network.QNetwork(env.observation_spec(), env.action_spec(), fc_layer_params=(100, 100))


clock = time.time()
try:
    # Start the Simulation
    for episode in range(MAX_EPISODES):
        done = False
        score = 0
        obs = env.reset()
        for step in range(MAX_STEPS):

            obs0 = [obs[0], obs[3], obs[1], obs[2]]
            act0 = agent0.choose_action(obs0)

            obs1 = [obs[3], obs[0], obs[4], obs[5]]
            act1 = linearAgent(obs1)

            print(act0, act1)

            # new_state, reward, done, info = env.step(act)

    env.close()
except Exception as e:
    print(str(e))
    traceback.print_exc()
finally:
    print("Done. Time Taken : {:.2f}".format(time.time()-clock))
    env.close()
