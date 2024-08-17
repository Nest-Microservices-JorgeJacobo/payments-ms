import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { env } from 'process';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(envs.stripeSecret);

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

        return session;

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
                //TODO call to own microservices
                // console.log(event)
                console.log({
                    metadata: chargeSucceeded.metadata,
                    orderId: chargeSucceeded.metadata.orderId
                })
                break;
            default:
                console.log(`Event ${event.type} not handled`)

        }


       return response.status(200).json({sig})
    }
}
