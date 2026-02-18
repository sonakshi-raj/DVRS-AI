import STATES from "./states";

class tranistionManager{
    constructor(){
        this.followups = 0;
        this.deepdives = 0;
    }
    nextState(currentState, signal){

        if (currentState === STATES.INTRO)
            return STATES.RESUME_QUESTION;

        if (currentState === STATES.RESUME_QUESTION){
            if (signal === 'GOOD')
                return STATES.DEEP_DIVE;
            return STATES.FOLLOW_UP;
        }

        if (currentState === STATES.FOLLOW_UP){
            this.followups++;
            if (this.followups >= 2) {
                this.followups = 0;
                return STATES.RESUME_QUESTION;
            }
            return STATES.FOLLOW_UP;
        }

        if (currentState === STATES.DEEP_DIVE){
            this.deepdives++;
            if (this.deepdives >= 2) {
                this.deepdives = 0;
                return STATES.RESUME_QUESTION;
            }
            return STATES.DEEP_DIVE;
        }

        if (signal === "time_up")
            return STATES.CLOSING;
        
        if (currentState === STATES.CLOSING)
            return STATES.END;

        return STATES.END;
    }
}

export default tranistionManager;
