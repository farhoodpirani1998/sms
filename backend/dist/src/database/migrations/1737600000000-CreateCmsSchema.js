"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCmsSchema1737600000000 = void 0;
class CreateCmsSchema1737600000000 {
    constructor() {
        this.name = 'CreateCmsSchema1737600000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS cms`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP SCHEMA IF EXISTS cms CASCADE`);
    }
}
exports.CreateCmsSchema1737600000000 = CreateCmsSchema1737600000000;
//# sourceMappingURL=1737600000000-CreateCmsSchema.js.map