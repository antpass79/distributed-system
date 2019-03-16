import express from 'express';
import * as bodyParser from "body-parser";
import cors from 'cors';

import { NodeConfig } from './utilities/node-config';
import { MongoPool } from './infrastructure-layer/mongo-pool';
import { SocketServer } from './infrastructure-layer/sockets/socket-hub';

export class Server {

    private _port: number | string;
    get port() {
        return this._port;
    }

    private _app: express.Application;
    private _socketServer: SocketServer = new SocketServer();

    constructor(port: number | string) {
        this._port = port;

        this._app = express();

        this._socketServer.listen();

        this.configure(this._app);
    }

    async start() {

        await MongoPool.connect();

        this._app.listen(this.port, () => {
            console.log('Server listening on port ' + this.port);
        });
    }

    private configure(app: express.Application) {

        this.configParser(app);
        this.configCors(app);
    }

    private configParser(app: express.Application) {
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
    }

    private configCors(app: express.Application) {

        let nodeConfig = new NodeConfig();

        let originsWhitelist = nodeConfig.getValue('ORIGINS_WHITE_LIST');
        let corsOptions = {
            origin: (origin: any, callback: any) => {
                var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
                callback(null, isWhitelisted);
            },
            credentials: true
        }
        app.use(cors(corsOptions));
    }
}