import { Module } from "@nestjs/common";
import { BookmarkModule } from "./bookmark/bookmark.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [UserModule, BookmarkModule, AuthModule]
})
export class AppModule { };