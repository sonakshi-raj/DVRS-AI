import InterviewEngine from "./engine/interviewEngine.js";

const engine = new InterviewEngine();

console.log("Start state:", engine.state);

console.log("After intro →", engine.process("START"));
console.log("After resume question →", engine.process("GOOD"));
console.log("After deep dive →", engine.process("GOOD"));
console.log("After deep dive again →", engine.process("GOOD"));
console.log("After followup →", engine.process("BAD"));
console.log("Time up →", engine.process("TIME_UP"));
