import { MigrationInterface, QueryRunner } from 'typeorm';

// Migración 4 del orden de ACUERDOS 6.15: tablas partido y anotacion.
// Va DESPUÉS de CFasesHabilidadJugador porque partido tiene una FK hacia fase (tabla de C),
// y también después de AInicial (equipo, escenario) y BJugadoresHabilidades (jugador).
export class BPartidosAnotaciones1795500000000 implements MigrationInterface {
  name = 'BPartidosAnotaciones1795500000000';

  // up: primero partido (depende de fase, equipo, escenario) y luego anotacion (depende de partido y jugador).
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`partido\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`fase_id\` int NOT NULL,
        \`equipo_local_id\` int NOT NULL,
        \`equipo_visitante_id\` int NOT NULL,
        \`fecha_hora\` datetime NOT NULL,
        \`escenario_id\` int NULL,
        \`ronda\` varchar(20) NULL,
        \`numero_llave\` int NULL,
        \`estado\` varchar(20) NOT NULL,
        \`marcador_local\` int NULL,
        \`marcador_visitante\` int NULL,
        \`fecha_creacion\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`anotacion\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`partido_id\` int NOT NULL,
        \`jugador_id\` int NOT NULL,
        \`minuto\` int NULL,
        \`valor\` int NOT NULL DEFAULT 1,
        \`descripcion\` varchar(255) NULL,
        \`fecha_registro\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    // FK de partido (equipo_local y equipo_visitante apuntan a la MISMA tabla equipo).
    await queryRunner.query(
      `ALTER TABLE \`partido\` ADD CONSTRAINT \`FK_partido_fase\`
        FOREIGN KEY (\`fase_id\`) REFERENCES \`fase\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`partido\` ADD CONSTRAINT \`FK_partido_equipo_local\`
        FOREIGN KEY (\`equipo_local_id\`) REFERENCES \`equipo\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`partido\` ADD CONSTRAINT \`FK_partido_equipo_visitante\`
        FOREIGN KEY (\`equipo_visitante_id\`) REFERENCES \`equipo\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`partido\` ADD CONSTRAINT \`FK_partido_escenario\`
        FOREIGN KEY (\`escenario_id\`) REFERENCES \`escenario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // FK de anotacion.
    await queryRunner.query(
      `ALTER TABLE \`anotacion\` ADD CONSTRAINT \`FK_anotacion_partido\`
        FOREIGN KEY (\`partido_id\`) REFERENCES \`partido\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`anotacion\` ADD CONSTRAINT \`FK_anotacion_jugador\`
        FOREIGN KEY (\`jugador_id\`) REFERENCES \`jugador\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  // down: orden inverso. anotacion depende de partido, así que se borra primero.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`anotacion\` DROP FOREIGN KEY \`FK_anotacion_jugador\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`anotacion\` DROP FOREIGN KEY \`FK_anotacion_partido\``,
    );
    await queryRunner.query(`DROP TABLE \`anotacion\``);

    await queryRunner.query(
      `ALTER TABLE \`partido\` DROP FOREIGN KEY \`FK_partido_escenario\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`partido\` DROP FOREIGN KEY \`FK_partido_equipo_visitante\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`partido\` DROP FOREIGN KEY \`FK_partido_equipo_local\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`partido\` DROP FOREIGN KEY \`FK_partido_fase\``,
    );
    await queryRunner.query(`DROP TABLE \`partido\``);
  }
}
