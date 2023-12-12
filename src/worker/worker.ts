export class TsWorker {
    public async init() {
        console.log("initiating...")
        console.log("ready");
    }
    public ready() {
        return true;
    }

    public async estimate(imageData = null) {
        return null;
    }

    public getWorkerInfo() {
        return {
            name: 'TsWorker',
            ready: this.ready()
        }
    }
}
