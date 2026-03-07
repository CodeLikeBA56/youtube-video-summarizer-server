import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) { }

  async transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = await this.schema.parseAsync(value);
      return parsedValue;
    } catch (error: any) {
      const errorMessage = error.issues?.[0]?.message || 'Validation failed';
      throw new BadRequestException(errorMessage);
    }
  }
}
