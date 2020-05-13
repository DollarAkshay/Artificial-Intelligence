import json
import urllib.request
import urllib.parse
import datetime
import time
import sys
import os


def getTopAgents():

    print("Fetching top agents")
    url = 'https://www.codingame.com/services/LeaderboardsRemoteService/getFilteredPuzzleLeaderboard'
    data = [
        "coders-strike-back",
        None,
        "global",
        {
            "active": False,
            "column": "",
            "filter": ""

        }
    ]
    req = urllib.request.Request(url, json.dumps(data).encode('utf8'), method="POST")
    req.add_header('Content-Type', 'application/json')
    res = urllib.request.urlopen(req)
    data = res.read().decode("utf-8")
    json_data = json.loads(str(data))['success']['users']
    agent_data = []
    for user in json_data:
        if 'agentId' in user and 'pseudo' in user:
            agent_data.append((user['agentId'], user['pseudo']))
    return agent_data[:10]


def getLastBattles(agentId, agentName):
    print("Fetching agentId {} ({}) last battles".format(agentId, agentName))
    url = 'https://www.codingame.com/services/gamesPlayersRankingRemoteService/findLastBattlesByAgentId'
    data = [
        agentId,
        None
    ]
    req = urllib.request.Request(url, json.dumps(data).encode('utf8'), method="POST")
    req.add_header('Content-Type', 'application/json')
    res = urllib.request.urlopen(req)
    data = res.read().decode("utf-8")
    json_data = json.loads(str(data))['success']
    game_ids = []
    for game in json_data:
        if 'gameId' in game:
            game_ids.append(game['gameId'])

    return game_ids[:1000]


def saveGameData(agentName, gameId):

    folder = './CodinGame/Coders_Strike_Back/data/{}/'.format(agentName)
    file_name = folder + '{}.json'.format(gameId)

    if not os.path.exists(folder):
        os.makedirs(folder)

    # If game data exits skip it
    if(os.path.exists(file_name)):
        print("Game data for {}/{} already exists".format(agentName, gameId))
        return

    url = 'https://www.codingame.com/services/gameResultRemoteService/findByGameId'
    data = [
        gameId,
        None
    ]
    req = urllib.request.Request(url, json.dumps(data).encode('utf8'), method="POST")
    req.add_header('Content-Type', 'application/json')
    res = urllib.request.urlopen(req)
    data = res.read().decode("utf-8")
    json_data = json.loads(str(data))['success']['frames']
    game_data = []
    for frame in json_data:
        frame.pop('gameInformation', None)
        frame.pop('keyframe', None)
        game_data.append(frame)

    with open(file_name, 'w') as f:
        json.dump(game_data, f, indent=2)

    print("Saved {}'s game {:d} to file".format(agentName, gameId))


top_agents = getTopAgents()
for agentId, agentName in top_agents:
    gameIds = getLastBattles(agentId, agentName)
    for gameId in gameIds:
        saveGameData(agentName, gameId)
