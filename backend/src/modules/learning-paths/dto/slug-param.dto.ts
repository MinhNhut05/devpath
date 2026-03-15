// slug-param.dto.ts - Validate slug URL param
//
// Tại sao cần validate slug?
// → Slug từ URL param là user input → không tin tưởng tuyệt đối
// → @Matches() dùng regex để đảm bảo slug đúng format
// → Format hợp lệ: "html-la-gi", "css-co-ban", "frontend-developer"
// → Format không hợp lệ: "../../etc/passwd", "../admin", "hello world"
//
// class-validator + ValidationPipe (đã setup trong main.ts) sẽ tự động validate
// khi controller dùng @Param() với DTO này.
//
// Dùng chung cho LearningPathsController và LessonsController.

import { Matches } from 'class-validator';

export class SlugParamDto {
  // Slug format: lowercase letters, numbers, hyphens
  // Ví dụ hợp lệ: "html-la-gi", "css-co-ban", "frontend-developer", "nestjs-101"
  // Ví dụ KHÔNG hợp lệ: "Hello World", "../../etc", "path/to/file"
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug!: string;
}
