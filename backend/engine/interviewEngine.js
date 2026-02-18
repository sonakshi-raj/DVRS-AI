import STATES from "./states";
import tranistionManager from "./transition";

class interviewEngine{
    constructor(){
        this.state = STATES.INTRO;
        this.tranistion = new tranistionManager();
    }

    process(signal){
        this.state = this.tranistion.nextState(this.state, signal);
        return this.state;
    }

    getState(){
        return this.state;
    }
}

export default interviewEngine;
