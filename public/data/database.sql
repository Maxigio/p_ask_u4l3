-- ============================================
-- p_ask_u4l3 — DATABASE v2
-- Stagione Aprile → Settembre 2026
-- Modifiche v2:
--   - mese_id rimosso da attivita/contenuti (si usa strftime sulla data)
--   - Opzione B: orario_inizio/fine = finestra presenza fisica
--     ore_shooting/montaggio = ore lavoro effettivo sul contenuto
--   - ore_montaggio_max → stima_ore_montaggio_totali
--   - ore_shooting_max → stima_ore_shooting_totali
-- ============================================

-- --------------------------------------------
-- SCHEMA
-- --------------------------------------------

CREATE TABLE tipologie_contenuto (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    -- Stime totali di progetto (non giornaliere)
    -- Usate per calcolare ore post-prod non tracciate puntualmente
    stima_ore_shooting_totali REAL,
    stima_ore_montaggio_totali REAL,
    piattaforma TEXT,
    descrizione TEXT
);

CREATE TABLE strutture (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    nome_interno TEXT,
    localita TEXT
);

CREATE TABLE referenti (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    ruolo TEXT NOT NULL,
    struttura_id INTEGER REFERENCES strutture(id)
);

-- Tabella mesi: solo riferimento descrittivo per fase stagione
-- NON usata come foreign key nelle tabelle operative
CREATE TABLE mesi_stagione (
    mese_num TEXT PRIMARY KEY,  -- es. '2026-04'
    nome TEXT NOT NULL,
    fase TEXT NOT NULL          -- 'pre_stagione','alta_stagione','post_stagione'
);

CREATE TABLE settimane (
    id INTEGER PRIMARY KEY,
    -- mese_id rimosso: si ricava da data_inizio con strftime
    numero_settimana INTEGER NOT NULL,
    data_inizio TEXT NOT NULL,
    data_fine TEXT NOT NULL,
    note TEXT
);

CREATE TABLE attivita (
    id INTEGER PRIMARY KEY,
    settimana_id INTEGER REFERENCES settimane(id),
    -- mese_id RIMOSSO: usare strftime('%Y-%m', data) nelle query
    data TEXT NOT NULL,
    giorno_settimana TEXT NOT NULL,
    tipo_giorno TEXT NOT NULL,
    tipologia_contenuto_id INTEGER REFERENCES tipologie_contenuto(id),
    referente_id INTEGER REFERENCES referenti(id),

    -- ORE LAVORO EFFETTIVO SUL CONTENUTO
    -- Rappresenta il carico creativo reale (shooting o montaggio)
    ore_shooting REAL DEFAULT 0,
    ore_montaggio REAL DEFAULT 0,

    -- FINESTRA DI PRESENZA FISICA
    -- Rappresenta quando sei fisicamente disponibile/presente
    -- Separato dalle ore effettive: es. G1 presenza 09-18 ma shooting effettivo 10h
    presenza_inizio TEXT,
    presenza_fine TEXT,

    -- ORARIO OPERATIVO (fasce fisse: archivio, call, montaggio serale)
    -- Usato quando orario e ore coincidono (es. montaggio 20-23 = 3h)
    orario_inizio TEXT,
    orario_fine TEXT,

    -- Flag per distinguere i due tipi di orario
    -- 'presenza' = finestra fisica (G1/G2/G3 riprese)
    -- 'operativo' = orario coincide con ore lavoro (montaggio sera, call, archivio)
    tipo_orario TEXT DEFAULT 'operativo',

    is_preview INTEGER DEFAULT 0,
    stato TEXT DEFAULT 'pianificato',
    note TEXT
);

CREATE TABLE contenuti (
    id INTEGER PRIMARY KEY,
    attivita_id INTEGER REFERENCES attivita(id),
    tipologia_id INTEGER REFERENCES tipologie_contenuto(id),
    -- mese_id RIMOSSO: usare strftime('%Y-%m', a.data) join con attivita
    settimana_id INTEGER REFERENCES settimane(id),
    formato TEXT,
    stato_consegna TEXT DEFAULT 'preview',
    note TEXT
);

-- TIPOLOGIE CONTENUTO
INSERT INTO tipologie_contenuto VALUES (1,'Spot Istituzionale','istituzionale',10.0,30.0,'multi','Pezzo premium narrativa brand CFH');
INSERT INTO tipologie_contenuto VALUES (2,'Video Servizio','video_long',5.0,10.0,'multi','Focus singolo servizio CFH');
INSERT INTO tipologie_contenuto VALUES (3,'Video Struttura','video_long',5.0,10.0,'multi','Tour visivo hotel specifico');
INSERT INTO tipologie_contenuto VALUES (4,'Video Evento Interno','video_long',5.0,10.0,'interno','Serate animazione gare feste');
INSERT INTO tipologie_contenuto VALUES (5,'Video YouTube','video_long',5.0,5.0,'youtube','Storytelling vacanza famiglia');
INSERT INTO tipologie_contenuto VALUES (6,'Reel Instagram','video_short',1.0,2.0,'instagram','Clip verticale max 90 sec');
INSERT INTO tipologie_contenuto VALUES (7,'Reel TikTok','video_short',1.0,2.0,'tiktok','Adattamento verticale');
INSERT INTO tipologie_contenuto VALUES (8,'Video Facebook','video_short',1.0,2.0,'facebook','Formato orizzontale famiglie');
INSERT INTO tipologie_contenuto VALUES (9,'Shooting Fotografico','foto',5.0,3.0,'multi','Sessione foto struttura e servizi');
INSERT INTO tipologie_contenuto VALUES (10,'Montaggio Archivio','video_long',0.0,30.0,'interno','Post-produzione da archivio');
INSERT INTO tipologie_contenuto VALUES (11,'Call Revisione','amministrativo',0.0,1.0,'interno','Call settimanale con referente');
INSERT INTO tipologie_contenuto VALUES (12,'Confezionamento','istituzionale',0.0,3.0,'multi','Finalizzazione contenuti settimana');

-- STRUTTURE
INSERT INTO strutture VALUES (1,'Tosi Beach','Tosi','Cesenatico');
INSERT INTO strutture VALUES (2,'Serenissima','Serenissima','Cesenatico');
INSERT INTO strutture VALUES (3,'Tintoretto','Tintoretto','Pinarella di Cervia');
INSERT INTO strutture VALUES (4,'Costa dei Pini','Costa dei Pini','Pinarella di Cervia');
INSERT INTO strutture VALUES (5,'Punta Nord','Rimini Village','Rimini');
INSERT INTO strutture VALUES (6,'Cervia Village','Cervia Village','Cervia');
INSERT INTO strutture VALUES (7,'MiMa Village','Milano Marittima Village','Milano Marittima');
INSERT INTO strutture VALUES (8,'Michelangelo','Michelangelo','Milano Marittima');
INSERT INTO strutture VALUES (9,'Best Family','Best Family','Riccione');
INSERT INTO strutture VALUES (10,'Conchiglie','Riccione Village','Riccione');
INSERT INTO strutture VALUES (11,'Milano Marittima','Milano Marittima','Milano Marittima');
INSERT INTO strutture VALUES (12,'Rimini Village','Rimini Village','Rimini');

-- REFERENTI
INSERT INTO referenti VALUES (1,'Rebecca','Capo Animatrice',NULL);
INSERT INTO referenti VALUES (2,'Giulia','Social Media Manager',NULL);
INSERT INTO referenti VALUES (3,'Lucio','Responsabile Ricevimento',NULL);
INSERT INTO referenti VALUES (4,'Capo_Ricevimento_Tosi','Capo Ricevimento',1);
INSERT INTO referenti VALUES (5,'Capo_Ricevimento_Serenissima','Capo Ricevimento',2);
INSERT INTO referenti VALUES (6,'Capo_Ricevimento_Tintoretto','Capo Ricevimento',3);
INSERT INTO referenti VALUES (7,'Capo_Ricevimento_CostaDeiPini','Capo Ricevimento',4);
INSERT INTO referenti VALUES (8,'Capo_Ricevimento_PuntaNord','Capo Ricevimento',5);
INSERT INTO referenti VALUES (9,'Capo_Ricevimento_CerviaVillage','Capo Ricevimento',6);
INSERT INTO referenti VALUES (10,'Capo_Ricevimento_MiMaVillage','Capo Ricevimento',7);
INSERT INTO referenti VALUES (11,'Capo_Ricevimento_Michelangelo','Capo Ricevimento',8);
INSERT INTO referenti VALUES (12,'Capo_Ricevimento_BestFamily','Capo Ricevimento',9);
INSERT INTO referenti VALUES (13,'Capo_Ricevimento_Conchiglie','Capo Ricevimento',10);
INSERT INTO referenti VALUES (14,'Capo_Ricevimento_MilanoMarittima','Capo Ricevimento',11);
INSERT INTO referenti VALUES (15,'Capo_Ricevimento_RiminiVillage','Capo Ricevimento',12);

-- MESI STAGIONE (riferimento descrittivo)
INSERT INTO mesi_stagione VALUES ('2026-04','Aprile','pre_stagione');
INSERT INTO mesi_stagione VALUES ('2026-05','Maggio','alta_stagione');
INSERT INTO mesi_stagione VALUES ('2026-06','Giugno','alta_stagione');
INSERT INTO mesi_stagione VALUES ('2026-07','Luglio','alta_stagione');
INSERT INTO mesi_stagione VALUES ('2026-08','Agosto','alta_stagione');
INSERT INTO mesi_stagione VALUES ('2026-09','Settembre','post_stagione');

-- SETTIMANE
INSERT INTO settimane VALUES (1,1,'2026-04-06','2026-04-10','Pre-stagione archivio');
INSERT INTO settimane VALUES (2,2,'2026-04-13','2026-04-16','Pre-stagione archivio');
INSERT INTO settimane VALUES (3,3,'2026-04-21','2026-04-24','Pre-stagione archivio');
INSERT INTO settimane VALUES (4,4,'2026-04-27','2026-04-29','Pre-stagione archivio');
INSERT INTO settimane VALUES (5,1,'2026-05-04','2026-05-09','');
INSERT INTO settimane VALUES (6,2,'2026-05-11','2026-05-16','');
INSERT INTO settimane VALUES (7,3,'2026-05-18','2026-05-23','');
INSERT INTO settimane VALUES (8,4,'2026-05-25','2026-05-30','');
INSERT INTO settimane VALUES (9,1,'2026-06-01','2026-06-06','');
INSERT INTO settimane VALUES (10,2,'2026-06-08','2026-06-13','');
INSERT INTO settimane VALUES (11,3,'2026-06-15','2026-06-20','');
INSERT INTO settimane VALUES (12,4,'2026-06-22','2026-06-27','');
INSERT INTO settimane VALUES (13,1,'2026-07-06','2026-07-11','');
INSERT INTO settimane VALUES (14,2,'2026-07-13','2026-07-18','');
INSERT INTO settimane VALUES (15,3,'2026-07-20','2026-07-25','');
INSERT INTO settimane VALUES (16,4,'2026-07-27','2026-08-01','');
INSERT INTO settimane VALUES (17,1,'2026-08-03','2026-08-08','');
INSERT INTO settimane VALUES (18,2,'2026-08-10','2026-08-15','FERRAGOSTO CFH');
INSERT INTO settimane VALUES (19,3,'2026-08-17','2026-08-22','');
INSERT INTO settimane VALUES (20,4,'2026-08-24','2026-08-29','');
INSERT INTO settimane VALUES (21,1,'2026-08-31','2026-09-03','Post-stagione archivio');
INSERT INTO settimane VALUES (22,2,'2026-09-07','2026-09-10','Post-stagione archivio');
INSERT INTO settimane VALUES (23,3,'2026-09-14','2026-09-17','Post-stagione archivio');
INSERT INTO settimane VALUES (24,4,'2026-09-21','2026-09-24','Post-stagione archivio');

-- ATTIVITA
INSERT INTO attivita VALUES (1,1,'2026-04-06','lunedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (2,1,'2026-04-06','lunedi','call',11,1,0,1.0,NULL,NULL,'14:00','15:00','operativo',0,'pianificato','Call revisione Rebecca');
INSERT INTO attivita VALUES (3,1,'2026-04-06','lunedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (4,1,'2026-04-07','martedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (5,1,'2026-04-07','martedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (6,1,'2026-04-08','mercoledi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (7,1,'2026-04-08','mercoledi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (8,1,'2026-04-09','giovedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (9,1,'2026-04-09','giovedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (10,2,'2026-04-13','lunedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (11,2,'2026-04-13','lunedi','call',11,1,0,1.0,NULL,NULL,'14:00','15:00','operativo',0,'pianificato','Call revisione Rebecca');
INSERT INTO attivita VALUES (12,2,'2026-04-13','lunedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (13,2,'2026-04-14','martedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (14,2,'2026-04-14','martedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (15,2,'2026-04-15','mercoledi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (16,2,'2026-04-15','mercoledi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (17,2,'2026-04-16','giovedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (18,2,'2026-04-16','giovedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (19,3,'2026-04-21','martedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (20,3,'2026-04-21','martedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (21,3,'2026-04-22','mercoledi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (22,3,'2026-04-22','mercoledi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (23,3,'2026-04-23','giovedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (24,3,'2026-04-23','giovedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (25,4,'2026-04-27','lunedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (26,4,'2026-04-27','lunedi','call',11,1,0,1.0,NULL,NULL,'14:00','15:00','operativo',0,'pianificato','Call revisione Rebecca');
INSERT INTO attivita VALUES (27,4,'2026-04-27','lunedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (28,4,'2026-04-28','martedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (29,4,'2026-04-28','martedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (30,4,'2026-04-29','mercoledi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Montaggio archivio mattina');
INSERT INTO attivita VALUES (31,4,'2026-04-29','mercoledi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Montaggio archivio sera');
INSERT INTO attivita VALUES (32,5,'2026-05-04','lunedi','riprese',2,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Piscina riscaldata + reel IG/TK/FB');
INSERT INTO attivita VALUES (33,5,'2026-05-04','lunedi','montaggio',2,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (34,5,'2026-05-05','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Tosi Beach + reel');
INSERT INTO attivita VALUES (35,5,'2026-05-05','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (36,5,'2026-05-06','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Tosi Beach');
INSERT INTO attivita VALUES (37,5,'2026-05-06','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (38,5,'2026-05-07','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (39,5,'2026-05-08','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (40,5,'2026-05-09','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (41,6,'2026-05-11','lunedi','riprese',3,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Serenissima + reel IG/TK/FB');
INSERT INTO attivita VALUES (42,6,'2026-05-11','lunedi','montaggio',3,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (43,6,'2026-05-12','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Serenissima + reel');
INSERT INTO attivita VALUES (44,6,'2026-05-12','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (45,6,'2026-05-13','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Serenissima');
INSERT INTO attivita VALUES (46,6,'2026-05-13','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (47,6,'2026-05-14','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (48,6,'2026-05-15','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (49,6,'2026-05-16','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (50,7,'2026-05-18','lunedi','riprese',2,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Animazione bambini + reel IG/TK/FB');
INSERT INTO attivita VALUES (51,7,'2026-05-18','lunedi','montaggio',2,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (52,7,'2026-05-19','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Tintoretto + reel');
INSERT INTO attivita VALUES (53,7,'2026-05-19','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (54,7,'2026-05-20','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Tintoretto');
INSERT INTO attivita VALUES (55,7,'2026-05-20','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (56,7,'2026-05-21','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (57,7,'2026-05-22','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (58,7,'2026-05-23','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (59,8,'2026-05-25','lunedi','riprese',1,1,10.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Spot Maggio + reel IG/TK/FB');
INSERT INTO attivita VALUES (60,8,'2026-05-25','lunedi','montaggio',1,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (61,8,'2026-05-26','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Costa dei Pini + reel');
INSERT INTO attivita VALUES (62,8,'2026-05-26','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (63,8,'2026-05-27','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Costa dei Pini');
INSERT INTO attivita VALUES (64,8,'2026-05-27','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (65,8,'2026-05-28','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (66,8,'2026-05-29','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (67,8,'2026-05-30','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (68,9,'2026-06-01','lunedi','riprese',2,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Tate Nanny School + reel IG/TK/FB');
INSERT INTO attivita VALUES (69,9,'2026-06-01','lunedi','montaggio',2,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (70,9,'2026-06-02','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Punta Nord + reel');
INSERT INTO attivita VALUES (71,9,'2026-06-02','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (72,9,'2026-06-03','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Punta Nord');
INSERT INTO attivita VALUES (73,9,'2026-06-03','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (74,9,'2026-06-04','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (75,9,'2026-06-05','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (76,9,'2026-06-06','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (77,10,'2026-06-08','lunedi','riprese',3,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Cervia Village + reel IG/TK/FB');
INSERT INTO attivita VALUES (78,10,'2026-06-08','lunedi','montaggio',3,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (79,10,'2026-06-09','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Cervia Village + reel');
INSERT INTO attivita VALUES (80,10,'2026-06-09','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (81,10,'2026-06-10','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Cervia Village');
INSERT INTO attivita VALUES (82,10,'2026-06-10','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (83,10,'2026-06-11','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (84,10,'2026-06-12','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (85,10,'2026-06-13','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (86,11,'2026-06-15','lunedi','riprese',2,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese All Inclusive Open Bar + reel IG/TK/FB');
INSERT INTO attivita VALUES (87,11,'2026-06-15','lunedi','montaggio',2,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (88,11,'2026-06-16','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube MiMa Village + reel');
INSERT INTO attivita VALUES (89,11,'2026-06-16','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (90,11,'2026-06-17','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico MiMa Village');
INSERT INTO attivita VALUES (91,11,'2026-06-17','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (92,11,'2026-06-18','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (93,11,'2026-06-19','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (94,11,'2026-06-20','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (95,12,'2026-06-22','lunedi','riprese',1,1,10.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Spot Giugno + reel IG/TK/FB');
INSERT INTO attivita VALUES (96,12,'2026-06-22','lunedi','montaggio',1,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (97,12,'2026-06-23','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Michelangelo + reel');
INSERT INTO attivita VALUES (98,12,'2026-06-23','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (99,12,'2026-06-24','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Michelangelo');
INSERT INTO attivita VALUES (100,12,'2026-06-24','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (101,12,'2026-06-25','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (102,12,'2026-06-26','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (103,12,'2026-06-27','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (104,13,'2026-07-06','lunedi','riprese',2,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Cucina a vista + reel IG/TK/FB');
INSERT INTO attivita VALUES (105,13,'2026-07-06','lunedi','montaggio',2,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (106,13,'2026-07-07','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Best Family + reel');
INSERT INTO attivita VALUES (107,13,'2026-07-07','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (108,13,'2026-07-08','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Best Family');
INSERT INTO attivita VALUES (109,13,'2026-07-08','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (110,13,'2026-07-09','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (111,13,'2026-07-10','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (112,13,'2026-07-11','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (113,14,'2026-07-13','lunedi','riprese',3,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Conchiglie + reel IG/TK/FB');
INSERT INTO attivita VALUES (114,14,'2026-07-13','lunedi','montaggio',3,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (115,14,'2026-07-14','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Conchiglie + reel');
INSERT INTO attivita VALUES (116,14,'2026-07-14','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (117,14,'2026-07-15','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Conchiglie');
INSERT INTO attivita VALUES (118,14,'2026-07-15','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (119,14,'2026-07-16','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (120,14,'2026-07-17','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (121,14,'2026-07-18','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (122,15,'2026-07-20','lunedi','riprese',2,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Family Boat + reel IG/TK/FB');
INSERT INTO attivita VALUES (123,15,'2026-07-20','lunedi','montaggio',2,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (124,15,'2026-07-21','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Milano Marittima + reel');
INSERT INTO attivita VALUES (125,15,'2026-07-21','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (126,15,'2026-07-22','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Milano Marittima');
INSERT INTO attivita VALUES (127,15,'2026-07-22','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (128,15,'2026-07-23','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (129,15,'2026-07-24','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (130,15,'2026-07-25','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (131,16,'2026-07-27','lunedi','riprese',1,1,10.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Spot Luglio + reel IG/TK/FB');
INSERT INTO attivita VALUES (132,16,'2026-07-27','lunedi','montaggio',1,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (133,16,'2026-07-28','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Rimini Village + reel');
INSERT INTO attivita VALUES (134,16,'2026-07-28','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (135,16,'2026-07-29','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Rimini Village');
INSERT INTO attivita VALUES (136,16,'2026-07-29','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (137,16,'2026-07-30','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (138,16,'2026-07-31','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (139,16,'2026-08-01','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (140,17,'2026-08-03','lunedi','riprese',2,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Playground indoor + reel IG/TK/FB');
INSERT INTO attivita VALUES (141,17,'2026-08-03','lunedi','montaggio',2,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (142,17,'2026-08-04','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Tosi Beach + reel');
INSERT INTO attivita VALUES (143,17,'2026-08-04','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (144,17,'2026-08-05','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Tosi Beach');
INSERT INTO attivita VALUES (145,17,'2026-08-05','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (146,17,'2026-08-06','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (147,17,'2026-08-07','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (148,17,'2026-08-08','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (149,18,'2026-08-10','lunedi','riprese',4,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Ferragosto CFH + reel IG/TK/FB');
INSERT INTO attivita VALUES (150,18,'2026-08-10','lunedi','montaggio',4,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (151,18,'2026-08-11','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Serenissima + reel');
INSERT INTO attivita VALUES (152,18,'2026-08-11','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (153,18,'2026-08-12','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Serenissima');
INSERT INTO attivita VALUES (154,18,'2026-08-12','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (155,18,'2026-08-13','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (156,18,'2026-08-14','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (157,18,'2026-08-15','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (158,19,'2026-08-17','lunedi','riprese',2,1,5.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Baby Parking + reel IG/TK/FB');
INSERT INTO attivita VALUES (159,19,'2026-08-17','lunedi','montaggio',2,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (160,19,'2026-08-18','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Tintoretto + reel');
INSERT INTO attivita VALUES (161,19,'2026-08-18','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (162,19,'2026-08-19','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Tintoretto');
INSERT INTO attivita VALUES (163,19,'2026-08-19','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (164,19,'2026-08-20','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (165,19,'2026-08-21','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (166,19,'2026-08-22','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (167,20,'2026-08-24','lunedi','riprese',1,1,10.0,0,'09:00','18:00',NULL,NULL,'presenza',0,'pianificato','Riprese Spot Agosto + reel IG/TK/FB');
INSERT INTO attivita VALUES (168,20,'2026-08-24','lunedi','montaggio',1,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview montaggio serale');
INSERT INTO attivita VALUES (169,20,'2026-08-25','martedi','riprese',5,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Riprese YouTube Costa dei Pini + reel');
INSERT INTO attivita VALUES (170,20,'2026-08-25','martedi','montaggio',5,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Preview YouTube serale');
INSERT INTO attivita VALUES (171,20,'2026-08-26','mercoledi','riprese',9,2,5.0,0,'09:00','14:00',NULL,NULL,'presenza',0,'pianificato','Shooting fotografico Costa dei Pini');
INSERT INTO attivita VALUES (172,20,'2026-08-26','mercoledi','montaggio',9,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',1,'pianificato','Editing foto serale');
INSERT INTO attivita VALUES (173,20,'2026-08-27','giovedi','montaggio',12,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Confezionamento finale settimana');
INSERT INTO attivita VALUES (174,20,'2026-08-28','venerdi','jolly',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Jolly disponibilita H24');
INSERT INTO attivita VALUES (175,20,'2026-08-29','sabato','vacanza',NULL,NULL,0,0,NULL,NULL,NULL,NULL,'operativo',0,'pianificato','Giorno di riposo');
INSERT INTO attivita VALUES (176,21,'2026-08-31','lunedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (177,21,'2026-08-31','lunedi','call',11,1,0,1.0,NULL,NULL,'14:00','15:00','operativo',0,'pianificato','Call revisione fine stagione Rebecca');
INSERT INTO attivita VALUES (178,21,'2026-08-31','lunedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (179,21,'2026-09-01','martedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (180,21,'2026-09-01','martedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (181,21,'2026-09-02','mercoledi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (182,21,'2026-09-02','mercoledi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (183,21,'2026-09-03','giovedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (184,21,'2026-09-03','giovedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (185,22,'2026-09-07','lunedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (186,22,'2026-09-07','lunedi','call',11,1,0,1.0,NULL,NULL,'14:00','15:00','operativo',0,'pianificato','Call revisione fine stagione Rebecca');
INSERT INTO attivita VALUES (187,22,'2026-09-07','lunedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (188,22,'2026-09-08','martedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (189,22,'2026-09-08','martedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (190,22,'2026-09-09','mercoledi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (191,22,'2026-09-09','mercoledi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (192,22,'2026-09-10','giovedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (193,22,'2026-09-10','giovedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (194,23,'2026-09-14','lunedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (195,23,'2026-09-14','lunedi','call',11,1,0,1.0,NULL,NULL,'14:00','15:00','operativo',0,'pianificato','Call revisione fine stagione Rebecca');
INSERT INTO attivita VALUES (196,23,'2026-09-14','lunedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (197,23,'2026-09-15','martedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (198,23,'2026-09-15','martedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (199,23,'2026-09-16','mercoledi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (200,23,'2026-09-16','mercoledi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (201,23,'2026-09-17','giovedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (202,23,'2026-09-17','giovedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (203,24,'2026-09-21','lunedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (204,24,'2026-09-21','lunedi','call',11,1,0,1.0,NULL,NULL,'14:00','15:00','operativo',0,'pianificato','Call revisione fine stagione Rebecca');
INSERT INTO attivita VALUES (205,24,'2026-09-21','lunedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (206,24,'2026-09-22','martedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (207,24,'2026-09-22','martedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (208,24,'2026-09-23','mercoledi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (209,24,'2026-09-23','mercoledi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');
INSERT INTO attivita VALUES (210,24,'2026-09-24','giovedi','archivio',10,NULL,0,4.0,NULL,NULL,'09:00','13:00','operativo',0,'pianificato','Post-produzione archivio mattina');
INSERT INTO attivita VALUES (211,24,'2026-09-24','giovedi','archivio',10,NULL,0,3.0,NULL,NULL,'20:00','23:00','operativo',0,'pianificato','Post-produzione archivio sera');

-- CONTENUTI
INSERT INTO contenuti VALUES (1,32,6,5,'9:16','preview','');
INSERT INTO contenuti VALUES (2,32,7,5,'9:16','preview','');
INSERT INTO contenuti VALUES (3,32,8,5,'16:9','preview','');
INSERT INTO contenuti VALUES (4,34,5,5,'16:9','preview','');
INSERT INTO contenuti VALUES (5,36,9,5,'3:2','preview','');
INSERT INTO contenuti VALUES (6,41,6,6,'9:16','preview','');
INSERT INTO contenuti VALUES (7,41,7,6,'9:16','preview','');
INSERT INTO contenuti VALUES (8,41,8,6,'16:9','preview','');
INSERT INTO contenuti VALUES (9,43,5,6,'16:9','preview','');
INSERT INTO contenuti VALUES (10,45,9,6,'3:2','preview','');
INSERT INTO contenuti VALUES (11,50,6,7,'9:16','preview','');
INSERT INTO contenuti VALUES (12,50,7,7,'9:16','preview','');
INSERT INTO contenuti VALUES (13,50,8,7,'16:9','preview','');
INSERT INTO contenuti VALUES (14,52,5,7,'16:9','preview','');
INSERT INTO contenuti VALUES (15,54,9,7,'3:2','preview','');
INSERT INTO contenuti VALUES (16,59,6,8,'9:16','preview','');
INSERT INTO contenuti VALUES (17,59,7,8,'9:16','preview','');
INSERT INTO contenuti VALUES (18,59,8,8,'16:9','preview','');
INSERT INTO contenuti VALUES (19,61,5,8,'16:9','preview','');
INSERT INTO contenuti VALUES (20,63,9,8,'3:2','preview','');
INSERT INTO contenuti VALUES (21,68,6,9,'9:16','preview','');
INSERT INTO contenuti VALUES (22,68,7,9,'9:16','preview','');
INSERT INTO contenuti VALUES (23,68,8,9,'16:9','preview','');
INSERT INTO contenuti VALUES (24,70,5,9,'16:9','preview','');
INSERT INTO contenuti VALUES (25,72,9,9,'3:2','preview','');
INSERT INTO contenuti VALUES (26,77,6,10,'9:16','preview','');
INSERT INTO contenuti VALUES (27,77,7,10,'9:16','preview','');
INSERT INTO contenuti VALUES (28,77,8,10,'16:9','preview','');
INSERT INTO contenuti VALUES (29,79,5,10,'16:9','preview','');
INSERT INTO contenuti VALUES (30,81,9,10,'3:2','preview','');
INSERT INTO contenuti VALUES (31,86,6,11,'9:16','preview','');
INSERT INTO contenuti VALUES (32,86,7,11,'9:16','preview','');
INSERT INTO contenuti VALUES (33,86,8,11,'16:9','preview','');
INSERT INTO contenuti VALUES (34,88,5,11,'16:9','preview','');
INSERT INTO contenuti VALUES (35,90,9,11,'3:2','preview','');
INSERT INTO contenuti VALUES (36,95,6,12,'9:16','preview','');
INSERT INTO contenuti VALUES (37,95,7,12,'9:16','preview','');
INSERT INTO contenuti VALUES (38,95,8,12,'16:9','preview','');
INSERT INTO contenuti VALUES (39,97,5,12,'16:9','preview','');
INSERT INTO contenuti VALUES (40,99,9,12,'3:2','preview','');
INSERT INTO contenuti VALUES (41,104,6,13,'9:16','preview','');
INSERT INTO contenuti VALUES (42,104,7,13,'9:16','preview','');
INSERT INTO contenuti VALUES (43,104,8,13,'16:9','preview','');
INSERT INTO contenuti VALUES (44,106,5,13,'16:9','preview','');
INSERT INTO contenuti VALUES (45,108,9,13,'3:2','preview','');
INSERT INTO contenuti VALUES (46,113,6,14,'9:16','preview','');
INSERT INTO contenuti VALUES (47,113,7,14,'9:16','preview','');
INSERT INTO contenuti VALUES (48,113,8,14,'16:9','preview','');
INSERT INTO contenuti VALUES (49,115,5,14,'16:9','preview','');
INSERT INTO contenuti VALUES (50,117,9,14,'3:2','preview','');
INSERT INTO contenuti VALUES (51,122,6,15,'9:16','preview','');
INSERT INTO contenuti VALUES (52,122,7,15,'9:16','preview','');
INSERT INTO contenuti VALUES (53,122,8,15,'16:9','preview','');
INSERT INTO contenuti VALUES (54,124,5,15,'16:9','preview','');
INSERT INTO contenuti VALUES (55,126,9,15,'3:2','preview','');
INSERT INTO contenuti VALUES (56,131,6,16,'9:16','preview','');
INSERT INTO contenuti VALUES (57,131,7,16,'9:16','preview','');
INSERT INTO contenuti VALUES (58,131,8,16,'16:9','preview','');
INSERT INTO contenuti VALUES (59,133,5,16,'16:9','preview','');
INSERT INTO contenuti VALUES (60,135,9,16,'3:2','preview','');
INSERT INTO contenuti VALUES (61,140,6,17,'9:16','preview','');
INSERT INTO contenuti VALUES (62,140,7,17,'9:16','preview','');
INSERT INTO contenuti VALUES (63,140,8,17,'16:9','preview','');
INSERT INTO contenuti VALUES (64,142,5,17,'16:9','preview','');
INSERT INTO contenuti VALUES (65,144,9,17,'3:2','preview','');
INSERT INTO contenuti VALUES (66,149,6,18,'9:16','preview','');
INSERT INTO contenuti VALUES (67,149,7,18,'9:16','preview','');
INSERT INTO contenuti VALUES (68,149,8,18,'16:9','preview','');
INSERT INTO contenuti VALUES (69,151,5,18,'16:9','preview','');
INSERT INTO contenuti VALUES (70,153,9,18,'3:2','preview','');
INSERT INTO contenuti VALUES (71,158,6,19,'9:16','preview','');
INSERT INTO contenuti VALUES (72,158,7,19,'9:16','preview','');
INSERT INTO contenuti VALUES (73,158,8,19,'16:9','preview','');
INSERT INTO contenuti VALUES (74,160,5,19,'16:9','preview','');
INSERT INTO contenuti VALUES (75,162,9,19,'3:2','preview','');
INSERT INTO contenuti VALUES (76,167,6,20,'9:16','preview','');
INSERT INTO contenuti VALUES (77,167,7,20,'9:16','preview','');
INSERT INTO contenuti VALUES (78,167,8,20,'16:9','preview','');
INSERT INTO contenuti VALUES (79,169,5,20,'16:9','preview','');
INSERT INTO contenuti VALUES (80,171,9,20,'3:2','preview','');