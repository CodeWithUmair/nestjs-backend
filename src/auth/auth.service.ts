import { Injectable, ConflictException, InternalServerErrorException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from "argon2";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async signup(dto: AuthDto) {
        try {
            // 1. Check if user already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

            if (existingUser) {
                throw new ConflictException("User with this email already exists");
            }

            // 2. Hash password
            const hash = await argon.hash(dto.password);

            // 3. Create new user
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash,
                },
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                },
            });

            return user;
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error; // user already exists
            }

            // Prisma might throw errors (unique constraint, etc.)
            throw new InternalServerErrorException("Something went wrong during signup");
        }
    }

    async signin(dto: AuthDto) {
        try {
            // 1. Check if user exists
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

            if (!user) {
                throw new ForbiddenException("Credentials Incorrect");
            }

            // 2. Compare password
            const pwMatches = await argon.verify(user.hash, dto.password);
            if (!pwMatches) {
                throw new ForbiddenException("Invalid credentials");
            }

            // 3. Return safe user object
            return {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
            };
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error; // invalid credentials
            }
            throw new InternalServerErrorException("Something went wrong during signin");
        }
    }
}
