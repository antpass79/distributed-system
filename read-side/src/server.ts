import express from 'express';
import * as bodyParser from "body-parser";
import cors from 'cors';

import { NodeConfig } from './utilities/node-config';
import { MongoPool } from './infrastructure-layer/mongo-pool';
import { SocketClient } from './infrastructure-layer/sockets/socket-client';
import { Feed } from './models/feed';
import { FeedService } from './application-layer/services/feed-service';

export class Server {

    private _port: number | string;
    get port() {
        return this._port;
    }

    private _nodeConfig: NodeConfig = new NodeConfig();
    private _app: express.Application;
    private _feedService: FeedService = new FeedService(this._nodeConfig.getValue('SERVER_SOCKET_PORT'));
    private _socketClient: SocketClient = new SocketClient(this._nodeConfig.getValue('CLIENT_SOCKET_ENDPINT'));

    constructor(port: number | string) {
        this._port = port;

        this._app = express();
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
        this.configureSockets();
    }

    private configParser(app: express.Application) {
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
    }

    private configCors(app: express.Application) {

        let originsWhitelist = this._nodeConfig.getValue('ORIGINS_WHITE_LIST');
        let corsOptions = {
            origin: (origin: any, callback: any) => {
                var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
                callback(null, isWhitelisted);
            },
            credentials: true
        }
        app.use(cors(corsOptions));
    }

    private configureSockets() {
        this._socketClient.on('feedAdded', (feed: Feed) => {
            this._feedService.broadcast(feed);
        });
    }
}