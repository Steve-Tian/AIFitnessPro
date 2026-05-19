import { BadRequestException, ValidationError } from '@nestjs/common';

export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  const fields: Record<string, string> = {};

  for (const error of errors) {
    if (error.constraints) {
      fields[error.property] = Object.values(error.constraints)[0];
    }
  }

  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: '请求参数不合法',
    fields,
  });
}
