import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  sendEmail(email: string, code: string) {
    return email + code;
  }
}
