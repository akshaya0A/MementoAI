import { AppServer, AppSession } from "@mentra/sdk";
import { unsubscribe } from "diagnostics_channel";
import fs from 'fs';

class VisionServer extends AppServer {
    /**
     * onSession is called automatically whenever a user connects.
     *
     * @param session   – Connection-scoped helper APIs and event emitters
     * @param sessionId – Unique identifier for this connection
     * @param userId    – MentraOS user identifier
     */
    protected async onSession(
        session: AppSession,
        sessionId: string,
        userId: string,
    ): Promise<void> {
        console.log(`User ${userId} connected`);

        //subscribe to button press events
        const unsubscribe = session.events.onButtonPress(async (data) => {
            // Request a photo from the smart glasses
            const photo = await session.camera.requestPhoto() //default size is medium

            console.log(`Photo captured: ${photo.filename}`)
            console.log(`Size: ${photo.size} bytes`)
            console.log(`Type: ${photo.mimeType}`)
            //console.log('button pressed!');
            this.processPhoto(session);
        });


        this.addCleanupHandler(unsubscribe);
    }

    // Mentra Docs provided methods - photo processing and uploading to API
    private async processPhoto(session: AppSession): Promise<void> {
        try {
            const photo = await session.camera.requestPhoto();

            // Convert to base64 for storage or transmission
            const base64String = photo.buffer.toString('base64');
            session.logger.info(`Photo as base64 (first 50 chars): ${base64String.substring(0, 50)}...`);

            // Save to file (Node.js)
            // const filename = `photo_${Date.now()}.jpg`;
            // fs.writeFileSync(filename, photo.buffer);
            // session.logger.info(`Photo saved to file: ${filename}`);

            // Send to external API
            await this.uploadPhotoToAPI(photo.buffer, photo.mimeType);
        } catch (error) {
            session.logger.error(`Failed to process photo: ${error}`);
        }
    }

    private async uploadPhotoToAPI(buffer: Buffer, mimeType: string): Promise<void> {
        // Example: Upload to your backend API
        console.log("uploading photo to API...");
        const formData = new FormData();
        const filename = `photo_${Date.now()}.jpg`;
        formData.append('photo', new Blob([buffer], { type: mimeType }), filename);
        await fetch('http://127.0.0.1:5000/upload', { method: 'POST', body: formData });
    }
}

// Bootstrap the server using environment variables for configuration
new VisionServer({
    packageName: process.env.PACKAGE_NAME ?? "com.example.voiceactivation",
    apiKey: process.env.MENTRAOS_API_KEY!,
    port: Number(process.env.PORT ?? "3000"),
}).start();