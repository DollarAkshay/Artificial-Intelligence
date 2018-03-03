import sys
import math
import matplotlib.pyplot as plt
import pyrosim


sim = pyrosim.Simulator(eval_time=100)
cylinder_1 = sim.send_cylinder(x=0, y=0, z=0.6)
cylinder_2 = sim.send_cylinder(x=0, y=0.5, z=1.1,
                               r1=0, r2=1, r3=0,
                               r=0, g=0.6, b=1)

joint = sim.send_hinge_joint(first_body_id=cylinder_1, second_body_id=cylinder_2,
                             x=0, y=0, z=1.1, n1=-1, n2=0, n3=0,
                             lo=-math.pi / 2, hi=math.pi / 2)

T1 = sim.send_touch_sensor(body_id=cylinder_1)
T2 = sim.send_touch_sensor(body_id=cylinder_2)
P1 = sim.send_proprioceptive_sensor(joint_id=joint)
R1 = sim.send_ray_sensor(body_id=cylinder_2, x=0, y=1.1, z=1.1,
                         r1=0, r2=1, r3=0)

sim.start()
sim.wait_to_finish()

sensorData = sim.get_sensor_data(sensor_id=T2)
print(sensorData)

f = plt.figure()
panel = f.add_subplot(111)
panel.set_ylim(-1, +2)
plt.plot(sensorData)
plt.show()
