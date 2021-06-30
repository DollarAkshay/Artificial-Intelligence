{
    /* Code for https://play.elevatorsaga.com/ */
    init: function(elevators, floors) {

        for (let i=0; i < elevators.length; i++){
            let elevator = elevators[i];
            
            elevator.pickupQueue = new Set([]);
            elevator.dropQueue = new Set([]);

            elevator.on("idle", function(){
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(false);
            });


            elevator.on("floor_button_pressed", function(floorNum){
                elevator.dropQueue.add(floorNum);
            })

            elevator.on("stopped_at_floor", function(floorNum) {
                elevator.dropQueue.delete(floorNum)
            })
        }


        for (let i=0; i < floors.length; i++){
            let floor = floors[i];
            let f = floor.floorNum()

            floor.on("up_button_pressed", function() {
                elevators[f%elevators.length].pickupQueue.add(f);
            });

            floor.on("down_button_pressed", function() {
                elevators[f%elevators.length].pickupQueue.add(f);
            });
        }
    },

    update: function(dt, elevators, floors) {
        
        for (let i=0; i < elevators.length; i++){

            let elevator = elevators[i];

            // if(elevator.currentFloor() == 0){
                // elevator.goingUpIndicator(true);
                // elevator.goingDownIndicator(false);
            // }
            // else if(elevator.currentFloor() == floors.length-1){
                // elevator.goingUpIndicator(false);
                // elevator.goingDownIndicator(true);
            // }

            console.log("Pickup Queue :", elevator.pickupQueue);
            console.log("Drop Queue :", elevator.dropQueue);
            console.log(elevator.goingUpIndicator(), elevator.goingDownIndicator())

            let next_floor = -1;
            if(elevator.goingUpIndicator()==true){

                let floor_dest = []
                let all_dest = [...elevator.dropQueue].concat([...elevator.pickupQueue]) 
                console.log("All _dset :", all_dest)

                for(let j=0; j < all_dest.length; j++){
                    if(all_dest[j] >= elevator.currentFloor()){
                        floor_dest.push(all_dest[j])
                    }
                }
                console.log("Floor Dest : ", floor_dest);
                if(floor_dest.length > 0){
                    next_floor = Math.min(...floor_dest);
                }
                else{
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                }
            }
            
            if(elevator.goingDownIndicator()==true){
                let floor_dest = []
                let all_dest = [...elevator.dropQueue].concat([...elevator.pickupQueue]) 
                console.log("All _dset :", all_dest)

                for(let j=0; j < all_dest.length; j++){
                    if(all_dest[j] <= elevator.currentFloor()){
                        floor_dest.push(all_dest[j])
                    }
                }
                console.log("Floor Dest : ", floor_dest);
                if(floor_dest.length > 0){
                    next_floor = Math.min(...floor_dest);
                }
                else{
                    elevator.goingDownIndicator(false);
                }
            }

            if(elevator.goingDownIndicator()==false && elevator.goingUpIndicator()==false){
                let pickupQueue_array = [...elevator.pickupQueue]
                if(pickupQueue_array.length > 0){
                    next_floor = pickupQueue_array[0]
                }
            }

            if(next_floor > elevator.currentFloor()){
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);
            }
            else{
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);
            }

            if(next_floor != -1){
                console.log("Going to floor :", next_floor);
                elevator.goToFloor(next_floor, true);
            }
        }
    }
}


