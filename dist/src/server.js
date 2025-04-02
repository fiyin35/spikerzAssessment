"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.get("/", (_, res) => {
    res.send("Welcome to the Playwright automation server!");
});
app.post("/run-automation", (req, res) => {
    console.log("Test execution started...");
    (0, child_process_1.exec)(`npx playwright test`, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            res.status(500).send({ message: "Test execution failed", error: stderr });
            return;
        }
        console.log(`stdout: ${stdout}`);
        res.status(200).send({ message: "Test execution started", output: stdout });
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        playwright: 'installed',
        time: new Date().toISOString()
    });
});
//# sourceMappingURL=server.js.map