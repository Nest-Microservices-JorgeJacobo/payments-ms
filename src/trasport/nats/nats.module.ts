import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {  envs } from 'src/config';
import { NATS_SERVICES } from 'src/config/services';


@Module({
    imports: [
        ClientsModule.register([
            {
                name: NATS_SERVICES,
                transport: Transport.NATS,
                options: {
                    servers: envs.natServers
                }
            }
        ])
    ],
    exports: [
        ClientsModule.register([
            {
                name: NATS_SERVICES,
                transport: Transport.NATS,
                options: {
                    servers: envs.natServers
                }
            }
        ])
    ]
})
export class NatsModule {


}
