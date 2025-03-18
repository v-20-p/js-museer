import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app: Express = express();
const port = 3002;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Ensure the images folder exists
const imagesFolder = path.join(__dirname, "images");
if (!fs.existsSync(imagesFolder)) {
  fs.mkdirSync(imagesFolder);
}

// Track camera states (on/off)
const cameraStates: Record<string, boolean> = {};

// Serve a basic endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server with Camera Control");
});

// Listen for Socket.IO connections
io.on("connection", (socket: Socket) => {
  console.log(`⚡: New client connected: ${socket.id}`);

  // Handle camera status toggle
  socket.on("toggleCamera", ({ cameraId, state }) => {
    cameraStates[cameraId] = state;
    console.log(`🔄: Camera ${cameraId} turned ${state ? "ON" : "OFF"}`);
    io.emit("cameraStatus", { cameraId, state });
  });

  // Receive image from a camera
  socket.on("cameraImage", ({ cameraId, image }) => {
    if (cameraStates[cameraId]) {
      console.log(`📷: Image received from Camera ${cameraId}`);

    //   // Decode base64 image
    //   const imageBuffer = Buffer.from(image, "base64");
    //   const timestamp = Date.now();
    //   const imageName = `${cameraId}_${timestamp}.jpg`;
    //   const imagePath = path.join(imagesFolder, imageName);

    //   // Save the image to the images folder
    //   fs.writeFileSync(imagePath, imageBuffer);
    //   console.log(`💾: Image saved as ${imageName}`);

      // Emit the image data to clients
      io.emit("newImage", { cameraId, image });
    }
  });

  // Send current camera states to newly connected clients
  socket.emit("allCameraStates", cameraStates);

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`❌: Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
