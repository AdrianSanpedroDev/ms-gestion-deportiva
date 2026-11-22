import { MigrationInterface, QueryRunner } from 'typeorm';

// Migración 2 del orden de ACUERDOS 6.15: tablas jugador, equipo_jugador y habilidad.
// Va DESPUÉS de AInicial porque equipo_jugador tiene una FK hacia equipo (tabla de A).
export class BJugadoresHabilidades1795400000000 implements MigrationInterface {
  name = 'BJugadoresHabilidades1795400000000';

  // up: crea las tablas. Primero las que no dependen de otras (jugador, habilidad) y al final equipo_jugador.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`jugador\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`tipo_documento\` varchar(20) NOT NULL,
        \`numero_documento\` varchar(20) NOT NULL,
        \`nombres\` varchar(100) NOT NULL,
        \`apellidos\` varchar(100) NOT NULL,
        \`fecha_nacimiento\` date NOT NULL,
        \`email\` varchar(150) NULL,
        \`telefono\` varchar(20) NULL,
        \`activo\` tinyint NOT NULL DEFAULT 1,
        \`fecha_creacion\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX \`UQ_jugador_documento\` (\`tipo_documento\`, \`numero_documento\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`habilidad\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(100) NOT NULL,
        \`descripcion\` varchar(500) NULL,
        \`categoria\` varchar(20) NOT NULL,
        \`fecha_creacion\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX \`UQ_habilidad_nombre\` (\`nombre\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`equipo_jugador\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`equipo_id\` int NOT NULL,
        \`jugador_id\` int NOT NULL,
        \`fecha_inicio\` date NOT NULL,
        \`fecha_fin\` date NOT NULL,
        \`fecha_retiro\` date NULL,
        \`activo\` tinyint NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    // FK de equipo_jugador: NO ACTION = MySQL no deja borrar un equipo o jugador que tenga contratos.
    await queryRunner.query(
      `ALTER TABLE \`equipo_jugador\` ADD CONSTRAINT \`FK_equipo_jugador_equipo\`
        FOREIGN KEY (\`equipo_id\`) REFERENCES \`equipo\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`equipo_jugador\` ADD CONSTRAINT \`FK_equipo_jugador_jugador\`
        FOREIGN KEY (\`jugador_id\`) REFERENCES \`jugador\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  // down: orden inverso. Primero las FK y la tabla que depende (equipo_jugador), luego las demás.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`equipo_jugador\` DROP FOREIGN KEY \`FK_equipo_jugador_jugador\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`equipo_jugador\` DROP FOREIGN KEY \`FK_equipo_jugador_equipo\``,
    );
    await queryRunner.query(`DROP TABLE \`equipo_jugador\``);
    await queryRunner.query(`DROP TABLE \`habilidad\``);
    await queryRunner.query(`DROP TABLE \`jugador\``);
  }
}
