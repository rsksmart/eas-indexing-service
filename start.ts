import {
  attestedEventSignature,
  getAndUpdateAllRelevantLogs,
  provider,
  registeredEventSignatureV1,
  registeredEventSignatureV2,
  revokedEventSignature,
  revokedOffchainEventSignature,
  timestampEventSignature,
} from "./utils";
import { startGraph } from "./graph";
import { ethers } from "ethers";

require("dotenv").config();

// Handle unhandled promise rejections (e.g., from internal polling errors)
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);  
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error); 
});

let running = false;
let timeout: NodeJS.Timeout | null = null;

const POLLING_INTERVAL = process.env.POLLING_INTERVAL
  ? Number(process.env.POLLING_INTERVAL)
  : 60000;

const DISABLE_LISTENER = process.env.DISABLE_LISTENER;

export async function update() {
  if (running) {
    return;
  }

  try {
    running = true;
    await getAndUpdateAllRelevantLogs();
  } catch (e) {
    console.log("Error!", e);
  }
  running = false;
}

function setGoTimeout() {
  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(() => {
    console.log("Timeout occurred, calling go function");
    go();
  }, POLLING_INTERVAL);
}
async function go() {
  await update();
  setGoTimeout();
}

const filter = {
  topics: [
    [
      ethers.id(registeredEventSignatureV1),
      ethers.id(registeredEventSignatureV2),
      ethers.id(attestedEventSignature),
      ethers.id(revokedEventSignature),
      ethers.id(timestampEventSignature),
      ethers.id(revokedOffchainEventSignature),
    ],
  ],
};

if (!DISABLE_LISTENER) {
  provider.on(filter, async (log: ethers.Log) => {
    go();
  });
}

go();
setGoTimeout();
startGraph();
