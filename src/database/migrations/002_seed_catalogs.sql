INSERT INTO public.catalog_types (code, label) VALUES
  ('role',                     'Roles del sistema'),
  ('task_type',                'Tipos de tarea'),
  ('relationship_type',        'Tipos de relacion'),
  ('announcement_target_type', 'Alcance de comunicados')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.catalog_values (type_code, code, label, "order", metadata) VALUES
  ('role','super_admin','Super Administrador',0,'{"canManageInstitutions":true}'),
  ('role','admin','Administrador',1,'{"canManageUsers":true}'),
  ('role','principal','Rector / Director',2,'{"canViewReports":true}'),
  ('role','teacher','Docente',3,'{"canCreateTasks":true,"canGrade":true}'),
  ('role','parent','Padre / Madre',4,'{"canViewGrades":true}'),
  ('role','student','Estudiante',5,'{"canViewOwnGrades":true}')
ON CONFLICT (type_code, code) DO NOTHING;

INSERT INTO public.catalog_values (type_code, code, label, "order") VALUES
  ('task_type','exam',          'Examen',         0),
  ('task_type','quiz',          'Quiz',           1),
  ('task_type','homework',      'Tarea',          2),
  ('task_type','classwork', 'Taller',  3),
  ('task_type','project',       'Proyecto',       4),
  ('task_type','participation', 'Participacion',  5),
  ('task_type','lab', 'Laboratorio',  6),
  ('relationship_type','father',   'Padre',   0),
  ('relationship_type','mother',   'Madre',   1),
  ('relationship_type','guardian', 'Acudiente', 2),
  ('announcement_target_type','all',         'Toda la institucion', 0),
  ('announcement_target_type','grade_level', 'Un grado',           1),
  ('announcement_target_type','group',       'Un grupo',           2)
ON CONFLICT (type_code, code) DO NOTHING;