import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data: keyof Usuario | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as Usuario & { escritorio: { id: string; nome: string; plano: string } };

    if (data) {
      if (data === 'escritorioId') return user.escritorio.id;
      return user[data];
    }

    return user;
  },
);
