import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserService } from './user.service';
import { UserDetailVo } from './vo/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { storage } from 'src/my-file-storage';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.register(registerUserDto);
  }

  @Get('register-captcha')
  async registerCaptcha(@Query('email') email: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`captcha_${email}`, code, 5 * 60);

    this.emailService.sendEmail(email, code);
  }

  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  @Post('login')
  async userLogin(@Body() loginUserDto: LoginUserDto) {
    return await this.userService.login(loginUserDto);
  }

  @Post('admin/login')
  async adminLogin(@Body() loginUserDto: LoginUserDto) {
    return await this.userService.login(loginUserDto, true);
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    return await this.userService.refreshToken(refreshToken);
  }

  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    return await this.userService.refreshToken(refreshToken);
  }

  @Get('info')
  @RequireLogin()
  async info(@Query('userId') userId: number) {
    const user = await this.userService.getUserInfoById(userId);

    if (user) {
      const vo = new UserDetailVo();
      vo.id = user.id;
      vo.email = user.email;
      vo.username = user.username;
      vo.headPic = user.headPic;
      vo.phoneNumber = user.phoneNumber;
      vo.nickName = user.nickName;
      vo.createTime = user.createTime;
      vo.isFrozen = user.isFrozen;

      return vo;
    }
  }

  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(@Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(updateUserDto);
  }

  @Post('update-password')
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
  ) {
    return await this.userService.updatePassword(userId, updateUserPasswordDto);
  }

  @Get('list')
  async list(
    @Query(
      'pageNo',
      new DefaultValuePipe(1),
      new ParseIntPipe({
        exceptionFactory() {
          throw new BadRequestException('page 必须为数字');
        },
      }),
    )
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      new ParseIntPipe({
        exceptionFactory() {
          throw new BadRequestException('pageSize 必须为数字');
        },
      }),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string,
  ) {
    return await this.userService.findUsersByPage({
      pageNo,
      pageSize,
      username,
      nickName,
      email,
    });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      storage: storage,
      fileFilter(req, file, callback) {
        const extname = path.extname(file.originalname);
        if (['.png', '.jpg', '.gif'].includes(extname)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('只能上传图片'), false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('🚀 ~ UserController ~ uploadFile ~ file:', file);

    return file.path;
  }

  @Post('freeze')
  async freeze(@Body('userId') userId: number) {
    return await this.userService.freezeUser(userId);
  }
}
