import sys
import pyrosim

sim = pyrosim.Simulator(play_paused=True, eval_time=1000)
cylinder_1 = sim.send_cylinder(x=0, y=0, z=0.6)
cylinder_2 = sim.send_cylinder(x=0, y=0.5, z=1.1,
                               r1=0, r2=1, r3=0,
                               r=0, g=0.6, b=1)

sim.start()
sim.wait_to_finish()
