import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { env } from 'process';
import { url } from 'inspector';
import { NATS_SERVICES } from 'src/config/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(envs.stripeSecret);
    private readonly logger = new Logger("PaymentServes");

    constructor(
        @Inject(NATS_SERVICES) private readonly client: ClientProxy,
    ) {}


    async createPaymentSession(paymentSessionDto:PaymentSessionDto) {

        const {currency, items, orderId}  = paymentSessionDto;

        const lineItems = items.map(item =>{
            return {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: item.name
                    }, 
                    unit_amount: Math.round(item.price * 100), // 20 dolares aqui van con el decimal  2000 / 100 =  20.00 // 15.000
                },
                quantity: item.quantity
            }
        });

        const session = await this.stripe.checkout.sessions.create(
            {
                //TODO: colocar aquí el ID de mi orden 
                payment_intent_data:  {
                    metadata: {
                        orderId
                    }
                },
                line_items: lineItems,
                mode: 'payment',
                success_url: envs.stripeSuccessUrl,
                cancel_url: envs.stripeCancelUrl
    
            }
        );

        // return session;
        return {
            cancelUrl: session.cancel_url,
            successUrl: session.success_url,
            url: session.url
        };


    }

    async stripeWebHook(request: Request, response: Response) {
        const sig = request.headers['stripe-signature'];
        console.log(sig)

        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(request['rawBody'], sig, envs.stripeEndPointUrl);
        } catch (error) {
            response.status(400).send(`Webhook Error: ${error.message}`);
            return;
        }

        console.log({event})

        switch(event.type) {
            case 'charge.succeeded':
                const chargeSucceeded = event.data.object;
                
                const payload  = {
                    stripePaymentId: chargeSucceeded.id,
                    orderId: chargeSucceeded.metadata.orderId,
                    receiptUrl: chargeSucceeded.receipt_url,

                }
                // this.logger.log(payload);
                this.client.emit('payment.succeeded',payload);
                break;
            default:
                console.log(`Event ${event.type} not handled`)

        }


       return response.status(200).json({sig})
    }
}
