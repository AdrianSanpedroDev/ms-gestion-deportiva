import { MigrationInterface, QueryRunner } from 'typeorm';

// Migración 3 del orden de ACUERDOS 6.15: tablas fase, grupo_equipo y habilidad_jugador (Persona C).
// Va DESPUÉS de AInicial (torneo, equipo) y BJugadoresHabilidades (jugador, habilidad),
// y ANTES de BPartidosAnotaciones (partido tiene FK hacia fase).
export class CFasesHabilidadJugador1795450000000 implements MigrationInterface {
  name = 'CFasesHabilidadJugador1795450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`fase\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`torneo_id\` int NOT NULL,
        \`nombre\` varchar(100) NOT NULL,
        \`orden\` int NOT NULL,
        \`tipo\` varchar(20) NOT NULL,
        \`cantidad_equipos\` int NULL,
        \`tercer_puesto\` tinyint NULL,
        \`fecha_creacion\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`IDX_fase_tipo\` (\`tipo\`),
        UNIQUE INDEX \`UQ_fase_torneo_nombre\` (\`torneo_id\`, \`nombre\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`grupo_equipo\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`grupo_id\` int NOT NULL,
        \`equipo_id\` int NOT NULL,
        UNIQUE INDEX \`UQ_grupo_equipo\` (\`grupo_id\`, \`equipo_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`habilidad_jugador\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`habilidad_id\` int NOT NULL,
        \`jugador_id\` int NOT NULL,
        \`fecha_asignacion\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX \`UQ_habilidad_jugador\` (\`habilidad_id\`, \`jugador_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    // FK de fase → torneo (NO ACTION: no permite borrar un torneo que tenga fases).
    await queryRunner.query(
      `ALTER TABLE \`fase\` ADD CONSTRAINT \`FK_fase_torneo\`
        FOREIGN KEY (\`torneo_id\`) REFERENCES \`torneo\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // FK de grupo_equipo: CASCADE al borrar el grupo; NO ACTION en equipo (ACUERDOS 6.11 y 6.15).
    await queryRunner.query(
      `ALTER TABLE \`grupo_equipo\` ADD CONSTRAINT \`FK_grupo_equipo_grupo\`
        FOREIGN KEY (\`grupo_id\`) REFERENCES \`fase\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`grupo_equipo\` ADD CONSTRAINT \`FK_grupo_equipo_equipo\`
        FOREIGN KEY (\`equipo_id\`) REFERENCES \`equipo\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // FK de habilidad_jugador → habilidad y jugador (NO ACTION).
    await queryRunner.query(
      `ALTER TABLE \`habilidad_jugador\` ADD CONSTRAINT \`FK_habilidad_jugador_habilidad\`
        FOREIGN KEY (\`habilidad_id\`) REFERENCES \`habilidad\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`habilidad_jugador\` ADD CONSTRAINT \`FK_habilidad_jugador_jugador\`
        FOREIGN KEY (\`jugador_id\`) REFERENCES \`jugador\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`habilidad_jugador\` DROP FOREIGN KEY \`FK_habilidad_jugador_jugador\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`habilidad_jugador\` DROP FOREIGN KEY \`FK_habilidad_jugador_habilidad\``,
    );
    await queryRunner.query(`DROP TABLE \`habilidad_jugador\``);

    await queryRunner.query(
      `ALTER TABLE \`grupo_equipo\` DROP FOREIGN KEY \`FK_grupo_equipo_equipo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`grupo_equipo\` DROP FOREIGN KEY \`FK_grupo_equipo_grupo\``,
    );
    await queryRunner.query(`DROP TABLE \`grupo_equipo\``);

    await queryRunner.query(
      `ALTER TABLE \`fase\` DROP FOREIGN KEY \`FK_fase_torneo\``,
    );
    await queryRunner.query(`DROP TABLE \`fase\``);
  }
}
