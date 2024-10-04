import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class HealtCheckController {

    @Get("")
    healthCheck(){
        return 'Payments is up and running.';
    }

}
