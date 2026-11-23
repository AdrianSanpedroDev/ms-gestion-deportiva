import { MigrationInterface, QueryRunner } from 'typeorm';

export class AInicial1795300000000 implements MigrationInterface {
  name = 'AInicial1795300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE deporte (
      id int NOT NULL AUTO_INCREMENT,
      nombre varchar(100) NOT NULL,
      descripcion varchar(500) NULL,
      deporte_padre_id int NULL,
      activo tinyint NOT NULL DEFAULT 1,
      fecha_creacion datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE INDEX UQ_deporte_nombre (nombre),
      PRIMARY KEY (id),
      CONSTRAINT FK_deporte_padre FOREIGN KEY (deporte_padre_id) REFERENCES deporte(id) ON DELETE NO ACTION ON UPDATE NO ACTION
    ) ENGINE=InnoDB`);

    await queryRunner.query(`CREATE TABLE equipo (
      id int NOT NULL AUTO_INCREMENT,
      nombre varchar(100) NOT NULL,
      ciudad varchar(100) NOT NULL,
      fecha_fundacion date NULL,
      descripcion varchar(500) NULL,
      activo tinyint NOT NULL DEFAULT 1,
      fecha_creacion datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE INDEX UQ_equipo_nombre (nombre),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB`);

    await queryRunner.query(`CREATE TABLE equipo_deporte (
      id int NOT NULL AUTO_INCREMENT,
      equipo_id int NOT NULL,
      deporte_id int NOT NULL,
      fecha_asociacion datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE INDEX UQ_equipo_deporte (equipo_id,deporte_id),
      PRIMARY KEY (id),
      CONSTRAINT FK_equipo_deporte_equipo FOREIGN KEY (equipo_id) REFERENCES equipo(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
      CONSTRAINT FK_equipo_deporte_deporte FOREIGN KEY (deporte_id) REFERENCES deporte(id) ON DELETE NO ACTION ON UPDATE NO ACTION
    ) ENGINE=InnoDB`);

    await queryRunner.query(`CREATE TABLE escenario (
      id int NOT NULL AUTO_INCREMENT,
      nombre varchar(150) NOT NULL,
      direccion varchar(255) NULL,
      capacidad int NULL,
      escenario_padre_id int NULL,
      UNIQUE INDEX UQ_escenario_nombre (nombre),
      PRIMARY KEY (id),
      CONSTRAINT FK_escenario_padre FOREIGN KEY (escenario_padre_id) REFERENCES escenario(id) ON DELETE NO ACTION ON UPDATE NO ACTION
    ) ENGINE=InnoDB`);

    await queryRunner.query(`CREATE TABLE torneo (
      id int NOT NULL AUTO_INCREMENT,
      nombre varchar(150) NOT NULL,
      deporte_id int NOT NULL,
      descripcion varchar(500) NULL,
      fecha_inicio date NOT NULL,
      fecha_fin date NOT NULL,
      fecha_cierre_inscripciones date NOT NULL,
      max_equipos int NULL,
      estado varchar(30) NOT NULL,
      fecha_creacion datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE INDEX UQ_torneo_nombre (nombre),
      PRIMARY KEY (id),
      CONSTRAINT FK_torneo_deporte FOREIGN KEY (deporte_id) REFERENCES deporte(id) ON DELETE NO ACTION ON UPDATE NO ACTION
    ) ENGINE=InnoDB`);

    await queryRunner.query(`CREATE TABLE inscripcion (
      id int NOT NULL AUTO_INCREMENT,
      torneo_id int NOT NULL,
      equipo_id int NOT NULL,
      fecha_inscripcion datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE INDEX UQ_torneo_equipo (torneo_id,equipo_id),
      PRIMARY KEY (id),
      CONSTRAINT FK_inscripcion_torneo FOREIGN KEY (torneo_id) REFERENCES torneo(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
      CONSTRAINT FK_inscripcion_equipo FOREIGN KEY (equipo_id) REFERENCES equipo(id) ON DELETE NO ACTION ON UPDATE NO ACTION
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE inscripcion');
    await queryRunner.query('DROP TABLE torneo');
    await queryRunner.query('DROP TABLE escenario');
    await queryRunner.query('DROP TABLE equipo_deporte');
    await queryRunner.query('DROP TABLE equipo');
    await queryRunner.query('DROP TABLE deporte');
  }
}
