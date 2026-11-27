import 'dotenv/config';
import express, { type Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const SCHOOLMIS_2569_2_RECORDS = [{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010001","school_name":"ชุมชนบ้านปางหมู","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":4,"k0_rooms":1,"k1_students":0,"k1_rooms":0,"k2_students":7,"k2_rooms":1,"p1_students":10,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":19,"p4_rooms":1,"p5_students":14,"p5_rooms":1,"p6_students":14,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":48,"total_female":33,"total_students":81,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010002","school_name":"บ้านกุงไม้สักมิตรภาพที่ 98","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":10,"k2_rooms":1,"p1_students":7,"p1_rooms":1,"p2_students":8,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":7,"p4_rooms":1,"p5_students":11,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":37,"total_female":30,"total_students":67,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010003","school_name":"บ้านทุ่งกองมู","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":15,"k2_rooms":1,"p1_students":11,"p1_rooms":1,"p2_students":15,"p2_rooms":1,"p3_students":24,"p3_rooms":1,"p4_students":19,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":56,"total_female":49,"total_students":105,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010004","school_name":"บ้านสบสอย","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":2,"k0_rooms":1,"k1_students":6,"k1_rooms":1,"k2_students":12,"k2_rooms":1,"p1_students":20,"p1_rooms":1,"p2_students":23,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":0,"p4_rooms":0,"p5_students":4,"p5_rooms":1,"p6_students":3,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":39,"total_female":36,"total_students":75,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010005","school_name":"บ้านในสอย","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":38,"k1_rooms":2,"k2_students":41,"k2_rooms":2,"p1_students":47,"p1_rooms":2,"p2_students":46,"p2_rooms":2,"p3_students":23,"p3_rooms":1,"p4_students":39,"p4_rooms":2,"p5_students":37,"p5_rooms":2,"p6_students":22,"p6_rooms":1,"m1_students":28,"m1_rooms":1,"m2_students":25,"m2_rooms":1,"m3_students":13,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":194,"total_female":165,"total_students":359,"total_rooms":17},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010006","school_name":"บ้านไม้สะเป่","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":1,"k1_rooms":1,"k2_students":2,"k2_rooms":1,"p1_students":19,"p1_rooms":1,"p2_students":10,"p2_rooms":1,"p3_students":11,"p3_rooms":1,"p4_students":7,"p4_rooms":1,"p5_students":10,"p5_rooms":1,"p6_students":6,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":45,"total_female":21,"total_students":66,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010007","school_name":"บ้านสบป่อง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":5,"k0_rooms":1,"k1_students":4,"k1_rooms":1,"k2_students":11,"k2_rooms":1,"p1_students":11,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":13,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":38,"total_female":38,"total_students":76,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010008","school_name":"บ้านใหม่","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":9,"k0_rooms":1,"k1_students":7,"k1_rooms":1,"k2_students":12,"k2_rooms":1,"p1_students":15,"p1_rooms":1,"p2_students":11,"p2_rooms":1,"p3_students":10,"p3_rooms":1,"p4_students":10,"p4_rooms":1,"p5_students":15,"p5_rooms":1,"p6_students":9,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":50,"total_female":48,"total_students":98,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010009","school_name":"บ้านท่าโป่งแดง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":7,"k2_rooms":1,"p1_students":14,"p1_rooms":1,"p2_students":19,"p2_rooms":1,"p3_students":17,"p3_rooms":1,"p4_students":13,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":3,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":41,"total_female":49,"total_students":90,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010012","school_name":"บ้านห้วยเดื่อ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":14,"k1_rooms":1,"k2_students":13,"k2_rooms":1,"p1_students":19,"p1_rooms":1,"p2_students":14,"p2_rooms":1,"p3_students":19,"p3_rooms":1,"p4_students":13,"p4_rooms":1,"p5_students":13,"p5_rooms":1,"p6_students":2,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":55,"total_female":52,"total_students":107,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010013","school_name":"อนุบาลเมือง (ป่าปุ๊มิตรภาพที่ 29)","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":5,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":13,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":4,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":11,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":29,"total_female":25,"total_students":54,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010015","school_name":"บ้านน้ำเพียงดิน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":3,"k0_rooms":1,"k1_students":10,"k1_rooms":1,"k2_students":12,"k2_rooms":1,"p1_students":8,"p1_rooms":1,"p2_students":28,"p2_rooms":1,"p3_students":15,"p3_rooms":1,"p4_students":13,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":51,"total_female":50,"total_students":101,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010016","school_name":"บ้านห้วยเสือเฒ่า(เจ้ากอแก้วอุปถัมภ์)","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":8,"k1_rooms":1,"k2_students":10,"k2_rooms":1,"p1_students":28,"p1_rooms":2,"p2_students":16,"p2_rooms":1,"p3_students":13,"p3_rooms":1,"p4_students":7,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":14,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":49,"total_female":51,"total_students":100,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010018","school_name":"ชุมชนบ้านผาบ่อง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":8,"k1_rooms":1,"k2_students":13,"k2_rooms":1,"p1_students":18,"p1_rooms":1,"p2_students":11,"p2_rooms":1,"p3_students":18,"p3_rooms":1,"p4_students":14,"p4_rooms":1,"p5_students":13,"p5_rooms":1,"p6_students":14,"p6_rooms":1,"m1_students":17,"m1_rooms":1,"m2_students":23,"m2_rooms":1,"m3_students":16,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":70,"total_female":95,"total_students":165,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010019","school_name":"อนุบาลแม่ฮ่องสอน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":39,"k1_rooms":2,"k2_students":52,"k2_rooms":3,"p1_students":96,"p1_rooms":4,"p2_students":83,"p2_rooms":4,"p3_students":122,"p3_rooms":4,"p4_students":98,"p4_rooms":4,"p5_students":108,"p5_rooms":4,"p6_students":104,"p6_rooms":4,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":363,"total_female":339,"total_students":702,"total_rooms":29},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010020","school_name":"บ้านน้ำส่อม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":6,"k1_rooms":1,"k2_students":9,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":5,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":36,"total_female":19,"total_students":55,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010021","school_name":"บ้านห้วยช่างคำ สาขาบ้านห้วยช่างเหล็ก","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":7,"k0_rooms":1,"k1_students":3,"k1_rooms":1,"k2_students":0,"k2_rooms":0,"p1_students":6,"p1_rooms":1,"p2_students":4,"p2_rooms":1,"p3_students":1,"p3_rooms":1,"p4_students":0,"p4_rooms":0,"p5_students":2,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":15,"total_female":12,"total_students":27,"total_rooms":7},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010023","school_name":"ร่มเกล้าปางตองในโครงการตามพระราชดำริ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":5,"k2_rooms":1,"p1_students":38,"p1_rooms":2,"p2_students":55,"p2_rooms":2,"p3_students":50,"p3_rooms":2,"p4_students":51,"p4_rooms":2,"p5_students":32,"p5_rooms":1,"p6_students":22,"p6_rooms":1,"m1_students":17,"m1_rooms":1,"m2_students":5,"m2_rooms":1,"m3_students":5,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":138,"total_female":149,"total_students":287,"total_rooms":15},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010024","school_name":"บ้านห้วยมะเขือส้ม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":11,"k0_rooms":1,"k1_students":18,"k1_rooms":1,"k2_students":20,"k2_rooms":1,"p1_students":18,"p1_rooms":1,"p2_students":21,"p2_rooms":1,"p3_students":16,"p3_rooms":1,"p4_students":24,"p4_rooms":1,"p5_students":23,"p5_rooms":1,"p6_students":17,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":95,"total_female":73,"total_students":168,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010025","school_name":"บ้านห้วยขาน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":11,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":18,"p1_rooms":1,"p2_students":22,"p2_rooms":1,"p3_students":14,"p3_rooms":1,"p4_students":12,"p4_rooms":1,"p5_students":14,"p5_rooms":1,"p6_students":10,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":43,"total_female":64,"total_students":107,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010026","school_name":"บ้านนาป่าแปก","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":23,"k1_rooms":1,"k2_students":15,"k2_rooms":1,"p1_students":15,"p1_rooms":1,"p2_students":14,"p2_rooms":1,"p3_students":27,"p3_rooms":2,"p4_students":16,"p4_rooms":1,"p5_students":22,"p5_rooms":1,"p6_students":37,"p6_rooms":2,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":85,"total_female":84,"total_students":169,"total_rooms":10},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010027","school_name":"บ้านรักไทย","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":49,"k1_rooms":2,"k2_students":41,"k2_rooms":2,"p1_students":43,"p1_rooms":2,"p2_students":45,"p2_rooms":2,"p3_students":28,"p3_rooms":1,"p4_students":40,"p4_rooms":1,"p5_students":36,"p5_rooms":1,"p6_students":36,"p6_rooms":1,"m1_students":23,"m1_rooms":1,"m2_students":26,"m2_rooms":1,"m3_students":28,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":194,"total_female":201,"total_students":395,"total_rooms":15},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010028","school_name":"บ้านห้วยโป่งอ่อน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":2,"k2_rooms":1,"p1_students":3,"p1_rooms":1,"p2_students":2,"p2_rooms":1,"p3_students":3,"p3_rooms":1,"p4_students":3,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":1,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":15,"total_female":11,"total_students":26,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010029","school_name":"ชุมชนบ้านหมอกจำแป่","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":2,"k1_rooms":1,"k2_students":14,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":21,"p2_rooms":1,"p3_students":14,"p3_rooms":1,"p4_students":12,"p4_rooms":1,"p5_students":11,"p5_rooms":1,"p6_students":22,"p6_rooms":1,"m1_students":43,"m1_rooms":1,"m2_students":46,"m2_rooms":2,"m3_students":25,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":123,"total_female":96,"total_students":219,"total_rooms":12},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010030","school_name":"บ้านแม่สะงา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":5,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":11,"p2_rooms":1,"p3_students":8,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":2,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":20,"total_female":30,"total_students":50,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010034","school_name":"บ้านห้วยปมฝาด","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":3,"k1_rooms":1,"k2_students":2,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":0,"p3_rooms":0,"p4_students":3,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":0,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":8,"total_female":11,"total_students":19,"total_rooms":6},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010035","school_name":"บ้านห้วยปูลิง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":3,"k1_rooms":1,"k2_students":8,"k2_rooms":1,"p1_students":8,"p1_rooms":1,"p2_students":4,"p2_rooms":1,"p3_students":4,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":3,"m1_rooms":1,"m2_students":4,"m2_rooms":1,"m3_students":4,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":32,"total_female":23,"total_students":55,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010037","school_name":"บ้านห้วยปูเลย","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":5,"k1_rooms":1,"k2_students":0,"k2_rooms":0,"p1_students":3,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":18,"total_female":23,"total_students":41,"total_rooms":7},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010038","school_name":"บ้านห้วยตอง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":2,"k1_rooms":1,"k2_students":10,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":4,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":10,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":22,"total_female":22,"total_students":44,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010039","school_name":"บ้านหัวน้ำแม่ฮ่องสอน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":2,"k0_rooms":1,"k1_students":2,"k1_rooms":1,"k2_students":0,"k2_rooms":0,"p1_students":0,"p1_rooms":0,"p2_students":0,"p2_rooms":0,"p3_students":0,"p3_rooms":0,"p4_students":0,"p4_rooms":0,"p5_students":2,"p5_rooms":1,"p6_students":0,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":3,"total_female":3,"total_students":6,"total_rooms":3},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010040","school_name":"บ้านห้วยโป่ง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":6,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":25,"total_female":17,"total_students":42,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010041","school_name":"บ้านยอดดอยวิทยา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":12,"k1_rooms":2,"k2_students":17,"k2_rooms":2,"p1_students":14,"p1_rooms":2,"p2_students":18,"p2_rooms":1,"p3_students":12,"p3_rooms":2,"p4_students":16,"p4_rooms":1,"p5_students":16,"p5_rooms":2,"p6_students":8,"p6_rooms":2,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":52,"total_female":61,"total_students":113,"total_rooms":14},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010042","school_name":"บ้านกลาง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":3,"k0_rooms":1,"k1_students":6,"k1_rooms":1,"k2_students":2,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":4,"p2_rooms":1,"p3_students":2,"p3_rooms":1,"p4_students":3,"p4_rooms":1,"p5_students":6,"p5_rooms":1,"p6_students":2,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":12,"total_female":20,"total_students":32,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010043","school_name":"บ้านแก่นฟ้า","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":6,"p1_rooms":1,"p2_students":5,"p2_rooms":1,"p3_students":12,"p3_rooms":1,"p4_students":7,"p4_rooms":1,"p5_students":10,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":28,"total_female":26,"total_students":54,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010044","school_name":"บ้านป่าลาน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":13,"k1_rooms":1,"k2_students":16,"k2_rooms":1,"p1_students":12,"p1_rooms":1,"p2_students":17,"p2_rooms":1,"p3_students":14,"p3_rooms":1,"p4_students":16,"p4_rooms":1,"p5_students":21,"p5_rooms":1,"p6_students":18,"p6_rooms":1,"m1_students":28,"m1_rooms":1,"m2_students":23,"m2_rooms":1,"m3_students":17,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":100,"total_female":95,"total_students":195,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010045","school_name":"บ้านห้วยช่างคำ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":2,"k0_rooms":1,"k1_students":0,"k1_rooms":0,"k2_students":4,"k2_rooms":1,"p1_students":1,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":3,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":11,"total_female":20,"total_students":31,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010046","school_name":"เสรีวิทยา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":8,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":13,"p2_rooms":1,"p3_students":12,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":12,"p5_rooms":1,"p6_students":10,"p6_rooms":1,"m1_students":18,"m1_rooms":1,"m2_students":16,"m2_rooms":1,"m3_students":17,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":68,"total_female":64,"total_students":132,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010047","school_name":"บ้านไม้ซางหนาม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":4,"k0_rooms":1,"k1_students":3,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":8,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":0,"p4_rooms":0,"p5_students":5,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":26,"total_female":18,"total_students":44,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010048","school_name":"บ้านแม่จ๋า","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":3,"k1_rooms":1,"k2_students":5,"k2_rooms":1,"p1_students":7,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":0,"p5_rooms":0,"p6_students":6,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":17,"total_female":19,"total_students":36,"total_rooms":7},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010049","school_name":"บ้านหนองเขียว","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":13,"k1_rooms":1,"k2_students":14,"k2_rooms":1,"p1_students":12,"p1_rooms":1,"p2_students":15,"p2_rooms":1,"p3_students":12,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":9,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":48,"total_female":43,"total_students":91,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010050","school_name":"บ้านห้วยผา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":9,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":14,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":16,"p5_rooms":1,"p6_students":14,"p6_rooms":1,"m1_students":19,"m1_rooms":1,"m2_students":14,"m2_rooms":1,"m3_students":8,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":63,"total_female":62,"total_students":125,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010051","school_name":"ไทยรัฐวิทยา 99 (บ้านแม่สุยะ)","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":16,"k1_rooms":2,"k2_students":9,"k2_rooms":2,"p1_students":24,"p1_rooms":2,"p2_students":25,"p2_rooms":2,"p3_students":29,"p3_rooms":2,"p4_students":23,"p4_rooms":2,"p5_students":17,"p5_rooms":2,"p6_students":26,"p6_rooms":2,"m1_students":23,"m1_rooms":1,"m2_students":25,"m2_rooms":1,"m3_students":18,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":103,"total_female":132,"total_students":235,"total_rooms":19},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010052","school_name":"บ้านนาปลาจาด","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":3,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":9,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":26,"total_female":23,"total_students":49,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010053","school_name":"บ้านห้วยผึ้ง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":3,"k0_rooms":1,"k1_students":5,"k1_rooms":1,"k2_students":7,"k2_rooms":1,"p1_students":8,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":13,"p3_rooms":1,"p4_students":9,"p4_rooms":1,"p5_students":6,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":35,"total_female":30,"total_students":65,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010054","school_name":"บ้านคาหาน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":4,"k0_rooms":1,"k1_students":6,"k1_rooms":1,"k2_students":7,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":10,"p2_rooms":1,"p3_students":13,"p3_rooms":1,"p4_students":17,"p4_rooms":1,"p5_students":12,"p5_rooms":1,"p6_students":11,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":36,"total_female":53,"total_students":89,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010057","school_name":"ขุนยวม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":27,"k1_rooms":1,"k2_students":25,"k2_rooms":1,"p1_students":54,"p1_rooms":2,"p2_students":41,"p2_rooms":2,"p3_students":73,"p3_rooms":3,"p4_students":78,"p4_rooms":3,"p5_students":58,"p5_rooms":3,"p6_students":69,"p6_rooms":3,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":217,"total_female":208,"total_students":425,"total_rooms":18},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010058","school_name":"อนุบาลขุนยวม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":36,"k1_rooms":1,"k2_students":22,"k2_rooms":1,"p1_students":58,"p1_rooms":2,"p2_students":23,"p2_rooms":1,"p3_students":25,"p3_rooms":1,"p4_students":22,"p4_rooms":1,"p5_students":42,"p5_rooms":2,"p6_students":25,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":150,"total_female":103,"total_students":253,"total_rooms":10},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010059","school_name":"บ้านแม่สุริน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":4,"k1_rooms":2,"k2_students":8,"k2_rooms":2,"p1_students":9,"p1_rooms":3,"p2_students":4,"p2_rooms":2,"p3_students":1,"p3_rooms":1,"p4_students":8,"p4_rooms":3,"p5_students":5,"p5_rooms":2,"p6_students":14,"p6_rooms":3,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":21,"total_female":32,"total_students":53,"total_rooms":18},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010061","school_name":"บ้านแม่สะเป่ใต้","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":11,"p4_rooms":1,"p5_students":10,"p5_rooms":1,"p6_students":6,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":31,"total_female":31,"total_students":62,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010063","school_name":"ชุมชนบ้านเมืองปอน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":5,"k1_rooms":1,"k2_students":9,"k2_rooms":1,"p1_students":13,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":18,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":7,"p5_rooms":1,"p6_students":15,"p6_rooms":1,"m1_students":10,"m1_rooms":1,"m2_students":20,"m2_rooms":1,"m3_students":29,"m3_rooms":2,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":85,"total_female":56,"total_students":141,"total_rooms":12},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010065","school_name":"บ้านท่าหินส้ม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":1,"k0_rooms":1,"k1_students":1,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":3,"p1_rooms":1,"p2_students":5,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":16,"total_female":19,"total_students":35,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010066","school_name":"บ้านหนองแห้ง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":7,"k2_rooms":1,"p1_students":7,"p1_rooms":1,"p2_students":8,"p2_rooms":1,"p3_students":11,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":15,"m1_rooms":1,"m2_students":22,"m2_rooms":1,"m3_students":18,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":69,"total_female":45,"total_students":114,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010067","school_name":"บ้านแม่ลาก๊ะ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":3,"k0_rooms":1,"k1_students":2,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":5,"p1_rooms":1,"p2_students":4,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":4,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":11,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":30,"total_female":17,"total_students":47,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010068","school_name":"บ้านแม่โข่จู","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":2,"k0_rooms":1,"k1_students":2,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":5,"p1_rooms":1,"p2_students":2,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":3,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":20,"total_female":13,"total_students":33,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010069","school_name":"บ้านมะหินหลวง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":6,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":10,"p3_rooms":1,"p4_students":3,"p4_rooms":1,"p5_students":12,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":28,"total_female":29,"total_students":57,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010070","school_name":"บ้านแม่กิ๊","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":10,"k2_rooms":1,"p1_students":13,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":11,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":12,"p5_rooms":1,"p6_students":13,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":40,"total_female":41,"total_students":81,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010071","school_name":"บ้านห้วยส้าน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":2,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":8,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":9,"p4_rooms":1,"p5_students":6,"p5_rooms":1,"p6_students":3,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":21,"total_female":23,"total_students":44,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010072","school_name":"ห้วยต้นนุ่นวิทยา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":6,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":2,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":18,"total_female":16,"total_students":34,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010073","school_name":"บ้านห้วยนา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":8,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":29,"total_female":23,"total_students":52,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010074","school_name":"ต.ช.ด.บำรุงที่ 60","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":7,"k2_rooms":1,"p1_students":6,"p1_rooms":1,"p2_students":1,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":7,"p4_rooms":1,"p5_students":3,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":22,"total_female":21,"total_students":43,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010076","school_name":"ชุมชนต่อแพวิทยา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":11,"k2_rooms":1,"p1_students":18,"p1_rooms":1,"p2_students":17,"p2_rooms":1,"p3_students":24,"p3_rooms":1,"p4_students":23,"p4_rooms":2,"p5_students":10,"p5_rooms":1,"p6_students":9,"p6_rooms":1,"m1_students":6,"m1_rooms":1,"m2_students":4,"m2_rooms":1,"m3_students":7,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":71,"total_female":67,"total_students":138,"total_rooms":12},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010078","school_name":"บ้านหัวปอน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":3,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":3,"p1_rooms":1,"p2_students":4,"p2_rooms":1,"p3_students":0,"p3_rooms":0,"p4_students":2,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":0,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":11,"total_female":8,"total_students":19,"total_rooms":6},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010079","school_name":"บ้านแม่หาด","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":2,"k1_rooms":1,"k2_students":1,"k2_rooms":1,"p1_students":1,"p1_rooms":1,"p2_students":0,"p2_rooms":0,"p3_students":2,"p3_rooms":1,"p4_students":2,"p4_rooms":1,"p5_students":0,"p5_rooms":0,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":6,"total_female":7,"total_students":13,"total_rooms":6},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010080","school_name":"บ้านแม่ออ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":3,"k0_rooms":1,"k1_students":2,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":1,"p1_rooms":1,"p2_students":2,"p2_rooms":1,"p3_students":1,"p3_rooms":1,"p4_students":0,"p4_rooms":0,"p5_students":5,"p5_rooms":1,"p6_students":0,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":10,"total_female":7,"total_students":17,"total_rooms":7},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010081","school_name":"บ้านหว่าโน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":5,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":5,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":27,"total_female":21,"total_students":48,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010082","school_name":"บ้านแม่แจ๊ะ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":6,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":4,"p3_rooms":1,"p4_students":2,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":18,"total_female":14,"total_students":32,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010083","school_name":"บ้านแม่โกปี่","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":7,"p1_rooms":1,"p2_students":1,"p2_rooms":1,"p3_students":2,"p3_rooms":1,"p4_students":7,"p4_rooms":1,"p5_students":6,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":27,"total_female":16,"total_students":43,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010084","school_name":"บ้านปางตอง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":14,"k1_rooms":1,"k2_students":11,"k2_rooms":1,"p1_students":14,"p1_rooms":1,"p2_students":21,"p2_rooms":1,"p3_students":15,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":16,"p5_rooms":1,"p6_students":10,"p6_rooms":1,"m1_students":17,"m1_rooms":1,"m2_students":9,"m2_rooms":1,"m3_students":22,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":101,"total_female":56,"total_students":157,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010085","school_name":"บ้านแม่อูคอ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":20,"k1_rooms":1,"k2_students":9,"k2_rooms":1,"p1_students":23,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":12,"p4_rooms":1,"p5_students":6,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":44,"total_female":48,"total_students":92,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010086","school_name":"บ้านแม่อูคอหลวง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":1,"k1_rooms":1,"k2_students":2,"k2_rooms":1,"p1_students":2,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":3,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":13,"total_female":17,"total_students":30,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010087","school_name":"บ้านหัวแม่สุริน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":5,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":4,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":7,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":25,"total_female":22,"total_students":47,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010088","school_name":"บ้านพัฒนา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":8,"k1_rooms":1,"k2_students":8,"k2_rooms":1,"p1_students":8,"p1_rooms":1,"p2_students":8,"p2_rooms":1,"p3_students":8,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":13,"p5_rooms":1,"p6_students":9,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":39,"total_female":28,"total_students":67,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010089","school_name":"บ้านนางิ้ว","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":4,"k1_rooms":1,"k2_students":0,"k2_rooms":0,"p1_students":2,"p1_rooms":1,"p2_students":1,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":1,"p4_rooms":1,"p5_students":0,"p5_rooms":0,"p6_students":3,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":12,"total_female":4,"total_students":16,"total_rooms":6},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010090","school_name":"บ้านคำสุข","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":5,"k1_rooms":1,"k2_students":2,"k2_rooms":1,"p1_students":6,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":3,"p3_rooms":1,"p4_students":4,"p4_rooms":1,"p5_students":2,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":13,"total_female":17,"total_students":30,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010091","school_name":"บ้านทุ่งยาว","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":15,"k1_rooms":1,"k2_students":19,"k2_rooms":1,"p1_students":23,"p1_rooms":1,"p2_students":25,"p2_rooms":1,"p3_students":12,"p3_rooms":1,"p4_students":18,"p4_rooms":1,"p5_students":23,"p5_rooms":1,"p6_students":15,"p6_rooms":1,"m1_students":14,"m1_rooms":1,"m2_students":8,"m2_rooms":1,"m3_students":15,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":88,"total_female":99,"total_students":187,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010092","school_name":"บ้านทุ่งโป่งมิตรภาพที่ 78","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":6,"k1_rooms":1,"k2_students":9,"k2_rooms":1,"p1_students":15,"p1_rooms":1,"p2_students":17,"p2_rooms":1,"p3_students":18,"p3_rooms":1,"p4_students":18,"p4_rooms":1,"p5_students":17,"p5_rooms":1,"p6_students":17,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":58,"total_female":59,"total_students":117,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010094","school_name":"บ้านแพมบก","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":4,"k0_rooms":1,"k1_students":3,"k1_rooms":1,"k2_students":0,"k2_rooms":0,"p1_students":5,"p1_rooms":1,"p2_students":0,"p2_rooms":0,"p3_students":2,"p3_rooms":1,"p4_students":2,"p4_rooms":1,"p5_students":3,"p5_rooms":1,"p6_students":3,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":12,"total_female":10,"total_students":22,"total_rooms":7},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010096","school_name":"บ้านสบแพม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":4,"k1_rooms":1,"k2_students":1,"k2_rooms":1,"p1_students":3,"p1_rooms":1,"p2_students":2,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":3,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":18,"total_female":12,"total_students":30,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010097","school_name":"บ้านแม่อีแลบ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":4,"k0_rooms":1,"k1_students":9,"k1_rooms":1,"k2_students":8,"k2_rooms":1,"p1_students":9,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":3,"p3_rooms":1,"p4_students":2,"p4_rooms":1,"p5_students":1,"p5_rooms":1,"p6_students":0,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":15,"total_female":24,"total_students":39,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010099","school_name":"บ้านปางปึงราษฎร์บำรุง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":1,"k0_rooms":1,"k1_students":5,"k1_rooms":1,"k2_students":2,"k2_rooms":1,"p1_students":2,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":1,"p3_rooms":1,"p4_students":2,"p4_rooms":1,"p5_students":3,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":13,"total_female":11,"total_students":24,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010101","school_name":"บ้านแม่เหมืองหลวง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":6,"k1_rooms":1,"k2_students":9,"k2_rooms":1,"p1_students":6,"p1_rooms":1,"p2_students":5,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":13,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":14,"p6_rooms":1,"m1_students":13,"m1_rooms":1,"m2_students":4,"m2_rooms":1,"m3_students":4,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":57,"total_female":31,"total_students":88,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010102","school_name":"บ้านโป่งสา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":8,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":4,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":10,"p6_rooms":1,"m1_students":12,"m1_rooms":1,"m2_students":10,"m2_rooms":1,"m3_students":19,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":41,"total_female":51,"total_students":92,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010104","school_name":"ปางตองประชาสรรค์","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":7,"k0_rooms":1,"k1_students":5,"k1_rooms":1,"k2_students":5,"k2_rooms":1,"p1_students":10,"p1_rooms":1,"p2_students":2,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":10,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":30,"total_female":32,"total_students":62,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010105","school_name":"บ้านขุนสาใน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":20,"k1_rooms":1,"k2_students":25,"k2_rooms":1,"p1_students":12,"p1_rooms":1,"p2_students":25,"p2_rooms":1,"p3_students":16,"p3_rooms":1,"p4_students":18,"p4_rooms":1,"p5_students":16,"p5_rooms":1,"p6_students":24,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":91,"total_female":65,"total_students":156,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010106","school_name":"บ้านแกงหอม สาขาบ้านม้ง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":10,"k2_rooms":1,"p1_students":11,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":12,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":34,"total_female":36,"total_students":70,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010109","school_name":"บ้านสบสา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":3,"k0_rooms":1,"k1_students":6,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":3,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":8,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":32,"total_female":17,"total_students":49,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010110","school_name":"บ้านเมืองแปง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":17,"k1_rooms":1,"k2_students":13,"k2_rooms":1,"p1_students":14,"p1_rooms":1,"p2_students":18,"p2_rooms":1,"p3_students":17,"p3_rooms":1,"p4_students":13,"p4_rooms":1,"p5_students":12,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":35,"m1_rooms":2,"m2_students":42,"m2_rooms":2,"m3_students":46,"m3_rooms":2,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":125,"total_female":109,"total_students":234,"total_rooms":14},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010111","school_name":"บ้านผาสำราญ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":8,"k1_rooms":1,"k2_students":12,"k2_rooms":1,"p1_students":10,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":16,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":14,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":50,"total_female":34,"total_students":84,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010112","school_name":"บ้านห้วยหมีศรีสวัสดิ์","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":3,"k1_rooms":1,"k2_students":1,"k2_rooms":1,"p1_students":1,"p1_rooms":1,"p2_students":5,"p2_rooms":1,"p3_students":1,"p3_rooms":1,"p4_students":7,"p4_rooms":1,"p5_students":0,"p5_rooms":0,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":9,"total_female":13,"total_students":22,"total_rooms":7},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010113","school_name":"บ้านแกงหอม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":8,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":5,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":8,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":4,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":28,"total_female":16,"total_students":44,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010114","school_name":"บ้านแม่นาเติง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":9,"k1_rooms":1,"k2_students":9,"k2_rooms":1,"p1_students":11,"p1_rooms":1,"p2_students":8,"p2_rooms":1,"p3_students":16,"p3_rooms":1,"p4_students":11,"p4_rooms":1,"p5_students":14,"p5_rooms":1,"p6_students":12,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":50,"total_female":40,"total_students":90,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010117","school_name":"บ้านปางแปก","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":12,"k1_rooms":1,"k2_students":11,"k2_rooms":1,"p1_students":8,"p1_rooms":1,"p2_students":10,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":15,"p4_rooms":1,"p5_students":15,"p5_rooms":1,"p6_students":18,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":52,"total_female":44,"total_students":96,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010118","school_name":"บ้านไทรงาม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":4,"k1_rooms":1,"k2_students":5,"k2_rooms":1,"p1_students":2,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":8,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":3,"p5_rooms":1,"p6_students":3,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":21,"total_female":16,"total_students":37,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010119","school_name":"บ้านดอยผีลู","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":12,"k1_rooms":1,"k2_students":11,"k2_rooms":1,"p1_students":13,"p1_rooms":1,"p2_students":16,"p2_rooms":1,"p3_students":15,"p3_rooms":1,"p4_students":9,"p4_rooms":1,"p5_students":11,"p5_rooms":1,"p6_students":12,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":51,"total_female":48,"total_students":99,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010120","school_name":"บ้านดอยผีลู สาขาบ้านในของ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":4,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":8,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":7,"p4_rooms":1,"p5_students":2,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":23,"total_female":20,"total_students":43,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010122","school_name":"บ้านหมอแปง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":12,"k1_rooms":1,"k2_students":12,"k2_rooms":1,"p1_students":13,"p1_rooms":1,"p2_students":12,"p2_rooms":1,"p3_students":13,"p3_rooms":1,"p4_students":17,"p4_rooms":1,"p5_students":12,"p5_rooms":1,"p6_students":14,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":50,"total_female":55,"total_students":105,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010123","school_name":"บ้านป่ายาง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":10,"p1_rooms":1,"p2_students":8,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":10,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":34,"total_female":30,"total_students":64,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010125","school_name":"บ้านน้ำปลามุง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":3,"k1_rooms":1,"k2_students":5,"k2_rooms":1,"p1_students":3,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":3,"p4_rooms":1,"p5_students":2,"p5_rooms":1,"p6_students":1,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":17,"total_female":12,"total_students":29,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010127","school_name":"ชุมชนบ้านแม่ฮี้","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":23,"k1_rooms":1,"k2_students":21,"k2_rooms":1,"p1_students":25,"p1_rooms":1,"p2_students":33,"p2_rooms":2,"p3_students":30,"p3_rooms":2,"p4_students":24,"p4_rooms":1,"p5_students":27,"p5_rooms":1,"p6_students":26,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":111,"total_female":98,"total_students":209,"total_rooms":10},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010128","school_name":"บ้านแม่ปิง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":11,"k1_rooms":1,"k2_students":8,"k2_rooms":1,"p1_students":11,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":11,"p5_rooms":1,"p6_students":22,"p6_rooms":1,"m1_students":12,"m1_rooms":1,"m2_students":5,"m2_rooms":1,"m3_students":10,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":58,"total_female":56,"total_students":114,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010129","school_name":"อนุบาลปาย (เวียงใต้)","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":72,"k1_rooms":3,"k2_students":83,"k2_rooms":3,"p1_students":75,"p1_rooms":3,"p2_students":59,"p2_rooms":3,"p3_students":92,"p3_rooms":4,"p4_students":94,"p4_rooms":3,"p5_students":80,"p5_rooms":3,"p6_students":91,"p6_rooms":3,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":335,"total_female":311,"total_students":646,"total_rooms":25},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010130","school_name":"บ้านน้ำฮู","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":24,"k1_rooms":1,"k2_students":29,"k2_rooms":1,"p1_students":29,"p1_rooms":2,"p2_students":33,"p2_rooms":2,"p3_students":30,"p3_rooms":1,"p4_students":39,"p4_rooms":1,"p5_students":33,"p5_rooms":1,"p6_students":33,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":126,"total_female":124,"total_students":250,"total_rooms":10},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010131","school_name":"บ้านใหม่สหสัมพันธ์","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":6,"k0_rooms":1,"k1_students":12,"k1_rooms":1,"k2_students":12,"k2_rooms":1,"p1_students":12,"p1_rooms":1,"p2_students":16,"p2_rooms":1,"p3_students":21,"p3_rooms":1,"p4_students":17,"p4_rooms":1,"p5_students":12,"p5_rooms":1,"p6_students":11,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":67,"total_female":52,"total_students":119,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010132","school_name":"บ้านเวียงเหนือ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":13,"k1_rooms":1,"k2_students":12,"k2_rooms":1,"p1_students":23,"p1_rooms":1,"p2_students":23,"p2_rooms":1,"p3_students":19,"p3_rooms":1,"p4_students":15,"p4_rooms":1,"p5_students":12,"p5_rooms":1,"p6_students":20,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":67,"total_female":70,"total_students":137,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010133","school_name":"สังวาลย์วิทย์ 3","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":12,"k1_rooms":1,"k2_students":26,"k2_rooms":1,"p1_students":21,"p1_rooms":1,"p2_students":15,"p2_rooms":1,"p3_students":21,"p3_rooms":1,"p4_students":21,"p4_rooms":1,"p5_students":26,"p5_rooms":1,"p6_students":17,"p6_rooms":1,"m1_students":28,"m1_rooms":1,"m2_students":24,"m2_rooms":1,"m3_students":17,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":127,"total_female":101,"total_students":228,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010135","school_name":"บ้านเมืองแพม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":5,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":5,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":11,"p4_rooms":1,"p5_students":11,"p5_rooms":1,"p6_students":13,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":30,"total_female":35,"total_students":65,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010136","school_name":"บ้านถ้ำลอด","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":11,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":16,"p1_rooms":1,"p2_students":25,"p2_rooms":1,"p3_students":16,"p3_rooms":1,"p4_students":19,"p4_rooms":1,"p5_students":20,"p5_rooms":1,"p6_students":15,"p6_rooms":1,"m1_students":19,"m1_rooms":1,"m2_students":19,"m2_rooms":1,"m3_students":12,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":92,"total_female":86,"total_students":178,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010137","school_name":"บ้านผามอน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":7,"k0_rooms":1,"k1_students":8,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":5,"p1_rooms":1,"p2_students":4,"p2_rooms":1,"p3_students":1,"p3_rooms":1,"p4_students":10,"p4_rooms":1,"p5_students":6,"p5_rooms":1,"p6_students":10,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":23,"total_female":32,"total_students":55,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010138","school_name":"บ้านห้วยแห้ง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":8,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":10,"p1_rooms":1,"p2_students":13,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":12,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":40,"total_female":30,"total_students":70,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010139","school_name":"บ้านวนาหลวง","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":13,"k1_rooms":1,"k2_students":11,"k2_rooms":1,"p1_students":11,"p1_rooms":1,"p2_students":14,"p2_rooms":1,"p3_students":17,"p3_rooms":1,"p4_students":9,"p4_rooms":1,"p5_students":17,"p5_rooms":1,"p6_students":20,"p6_rooms":1,"m1_students":19,"m1_rooms":1,"m2_students":15,"m2_rooms":1,"m3_students":14,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":74,"total_female":86,"total_students":160,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010140","school_name":"บ้านนาปู่ป้อม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":23,"k1_rooms":2,"k2_students":19,"k2_rooms":2,"p1_students":18,"p1_rooms":2,"p2_students":17,"p2_rooms":2,"p3_students":19,"p3_rooms":2,"p4_students":23,"p4_rooms":2,"p5_students":12,"p5_rooms":2,"p6_students":23,"p6_rooms":2,"m1_students":6,"m1_rooms":1,"m2_students":12,"m2_rooms":1,"m3_students":4,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":99,"total_female":77,"total_students":176,"total_rooms":19},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010141","school_name":"บ้านนาปู่ป้อม สาขาทุ่งสาแล","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":3,"k1_rooms":1,"k2_students":0,"k2_rooms":0,"p1_students":5,"p1_rooms":1,"p2_students":3,"p2_rooms":1,"p3_students":4,"p3_rooms":1,"p4_students":1,"p4_rooms":1,"p5_students":1,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":10,"total_female":12,"total_students":22,"total_rooms":7},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010142","school_name":"บ้านน้ำฮูผาเสื่อ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":3,"k0_rooms":1,"k1_students":1,"k1_rooms":1,"k2_students":3,"k2_rooms":1,"p1_students":1,"p1_rooms":1,"p2_students":2,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":1,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":10,"total_female":16,"total_students":26,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010143","school_name":"บ้านซอแบะ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":13,"k1_rooms":1,"k2_students":12,"k2_rooms":1,"p1_students":12,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":10,"p3_rooms":1,"p4_students":15,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":5,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":53,"total_female":32,"total_students":85,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010144","school_name":"บ้านปางบอนวัฒนาคาร","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":4,"k1_rooms":1,"k2_students":5,"k2_rooms":1,"p1_students":3,"p1_rooms":1,"p2_students":5,"p2_rooms":1,"p3_students":2,"p3_rooms":1,"p4_students":4,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":6,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":20,"total_female":17,"total_students":37,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010145","school_name":"บ้านทุ่งหลวงวัฒนาคาร","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":13,"k1_rooms":1,"k2_students":8,"k2_rooms":1,"p1_students":6,"p1_rooms":1,"p2_students":10,"p2_rooms":1,"p3_students":8,"p3_rooms":1,"p4_students":9,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":7,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":35,"total_female":34,"total_students":69,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010146","school_name":"บ้านแม่ละนา","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":6,"k1_rooms":1,"k2_students":9,"k2_rooms":1,"p1_students":10,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":8,"p3_rooms":1,"p4_students":4,"p4_rooms":1,"p5_students":15,"p5_rooms":1,"p6_students":12,"p6_rooms":1,"m1_students":11,"m1_rooms":1,"m2_students":4,"m2_rooms":1,"m3_students":10,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":45,"total_female":51,"total_students":96,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010147","school_name":"บ้านจ่าโบ่","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":7,"k0_rooms":1,"k1_students":5,"k1_rooms":1,"k2_students":10,"k2_rooms":1,"p1_students":5,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":7,"p5_rooms":1,"p6_students":2,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":29,"total_female":30,"total_students":59,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010148","school_name":"บ้านปางคาม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":22,"k1_rooms":1,"k2_students":17,"k2_rooms":2,"p1_students":36,"p1_rooms":2,"p2_students":24,"p2_rooms":1,"p3_students":24,"p3_rooms":1,"p4_students":15,"p4_rooms":1,"p5_students":18,"p5_rooms":1,"p6_students":19,"p6_rooms":1,"m1_students":17,"m1_rooms":1,"m2_students":15,"m2_rooms":1,"m3_students":17,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":110,"total_female":114,"total_students":224,"total_rooms":13},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010149","school_name":"บ้านยาป่าแหน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":6,"k0_rooms":1,"k1_students":7,"k1_rooms":1,"k2_students":7,"k2_rooms":1,"p1_students":14,"p1_rooms":1,"p2_students":6,"p2_rooms":1,"p3_students":9,"p3_rooms":1,"p4_students":11,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":2,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":42,"total_female":29,"total_students":71,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010151","school_name":"บ้านห้วยเฮี๊ยะ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":6,"k0_rooms":1,"k1_students":2,"k1_rooms":1,"k2_students":8,"k2_rooms":1,"p1_students":7,"p1_rooms":1,"p2_students":12,"p2_rooms":1,"p3_students":8,"p3_rooms":1,"p4_students":8,"p4_rooms":1,"p5_students":8,"p5_rooms":1,"p6_students":9,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":33,"total_female":35,"total_students":68,"total_rooms":9},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010152","school_name":"อนุบาลปางมะผ้า","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":25,"k0_rooms":3,"k1_students":73,"k1_rooms":3,"k2_students":78,"k2_rooms":3,"p1_students":75,"p1_rooms":3,"p2_students":59,"p2_rooms":2,"p3_students":89,"p3_rooms":3,"p4_students":69,"p4_rooms":3,"p5_students":78,"p5_rooms":3,"p6_students":68,"p6_rooms":3,"m1_students":60,"m1_rooms":3,"m2_students":47,"m2_rooms":2,"m3_students":48,"m3_rooms":2,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":390,"total_female":379,"total_students":769,"total_rooms":33},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010153","school_name":"บ้านน้ำริน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":10,"k1_rooms":1,"k2_students":11,"k2_rooms":1,"p1_students":5,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":5,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":11,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":31,"total_female":32,"total_students":63,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010154","school_name":"ศูนย์ปางมะผ้าในโครงการตามพระราชดำริ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":4,"k0_rooms":1,"k1_students":3,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":4,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":4,"p3_rooms":1,"p4_students":6,"p4_rooms":1,"p5_students":3,"p5_rooms":1,"p6_students":3,"p6_rooms":1,"m1_students":9,"m1_rooms":1,"m2_students":3,"m2_rooms":1,"m3_students":3,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":29,"total_female":24,"total_students":53,"total_rooms":12},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010155","school_name":"บ้านลุกป่าก๊อ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":7,"k1_rooms":1,"k2_students":4,"k2_rooms":1,"p1_students":7,"p1_rooms":1,"p2_students":9,"p2_rooms":1,"p3_students":6,"p3_rooms":1,"p4_students":16,"p4_rooms":1,"p5_students":9,"p5_rooms":1,"p6_students":4,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":26,"total_female":36,"total_students":62,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010156","school_name":"บ้านกึ้ดสามสิบ","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":12,"k1_rooms":1,"k2_students":14,"k2_rooms":1,"p1_students":7,"p1_rooms":1,"p2_students":7,"p2_rooms":1,"p3_students":7,"p3_rooms":1,"p4_students":3,"p4_rooms":1,"p5_students":7,"p5_rooms":1,"p6_students":8,"p6_rooms":1,"m1_students":5,"m1_rooms":1,"m2_students":6,"m2_rooms":1,"m3_students":6,"m3_rooms":1,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":45,"total_female":37,"total_students":82,"total_rooms":11},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010158","school_name":"บ้านใหม่ห้วยหวาย","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":8,"k1_rooms":1,"k2_students":6,"k2_rooms":1,"p1_students":6,"p1_rooms":1,"p2_students":5,"p2_rooms":1,"p3_students":4,"p3_rooms":1,"p4_students":5,"p4_rooms":1,"p5_students":5,"p5_rooms":1,"p6_students":9,"p6_rooms":1,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":22,"total_female":26,"total_students":48,"total_rooms":8},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010159","school_name":"โรงเรียนเขตพื้นที่การศึกษาอำเภอเมืองแม่ฮ่องสอน","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":3,"k0_rooms":0,"k1_students":7,"k1_rooms":0,"k2_students":5,"k2_rooms":0,"p1_students":16,"p1_rooms":0,"p2_students":6,"p2_rooms":0,"p3_students":9,"p3_rooms":0,"p4_students":5,"p4_rooms":0,"p5_students":9,"p5_rooms":0,"p6_students":9,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":40,"total_female":29,"total_students":69,"total_rooms":0},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010160","school_name":"เขตพื้นที่การศึกษาอำเภอขุนยวม","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":2,"k0_rooms":0,"k1_students":16,"k1_rooms":0,"k2_students":21,"k2_rooms":0,"p1_students":25,"p1_rooms":0,"p2_students":26,"p2_rooms":0,"p3_students":8,"p3_rooms":0,"p4_students":17,"p4_rooms":0,"p5_students":14,"p5_rooms":0,"p6_students":18,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":78,"total_female":69,"total_students":147,"total_rooms":0},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010161","school_name":"เขตพื้นที่การศึกษาอำเภอปาย","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":0,"k0_rooms":0,"k1_students":10,"k1_rooms":0,"k2_students":16,"k2_rooms":0,"p1_students":18,"p1_rooms":0,"p2_students":17,"p2_rooms":0,"p3_students":19,"p3_rooms":0,"p4_students":21,"p4_rooms":0,"p5_students":17,"p5_rooms":0,"p6_students":19,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":79,"total_female":58,"total_students":137,"total_rooms":0},{"semester":"2569-2","district_code":"58010000","district_name":"สพป.แม่ฮ่องสอน เขต 1","school_code":"58010162","school_name":"เขตพื้นที่การศึกษาอำเภอปางมะผ้า","source_filename":"2569-2-schoolmis-58010000.csv","k0_students":12,"k0_rooms":0,"k1_students":19,"k1_rooms":0,"k2_students":26,"k2_rooms":0,"p1_students":22,"p1_rooms":0,"p2_students":19,"p2_rooms":0,"p3_students":25,"p3_rooms":0,"p4_students":21,"p4_rooms":0,"p5_students":13,"p5_rooms":0,"p6_students":28,"p6_rooms":0,"m1_students":0,"m1_rooms":0,"m2_students":0,"m2_rooms":0,"m3_students":0,"m3_rooms":0,"m4_students":0,"m4_rooms":0,"m5_students":0,"m5_rooms":0,"m6_students":0,"m6_rooms":0,"total_male":88,"total_female":97,"total_students":185,"total_rooms":0}];

const THAI_MONTHS = [
  { value: 1, label: 'มกราคม', short: 'ม.ค.' },
  { value: 2, label: 'กุมภาพันธ์', short: 'ก.พ.' },
  { value: 3, label: 'มีนาคม', short: 'มี.ค.' },
  { value: 4, label: 'เมษายน', short: 'เม.ย.' },
  { value: 5, label: 'พฤษภาคม', short: 'พ.ค.' },
  { value: 6, label: 'มิถุนายน', short: 'มิ.ย.' },
  { value: 7, label: 'กรกฎาคม', short: 'ก.ค.' },
  { value: 8, label: 'สิงหาคม', short: 'ส.ค.' },
  { value: 9, label: 'กันยายน', short: 'ก.ย.' },
  { value: 10, label: 'ตุลาคม', short: 'ต.ค.' },
  { value: 11, label: 'พฤศจิกายน', short: 'พ.ย.' },
  { value: 12, label: 'ธันวาคม', short: 'ธ.ค.' },
] as const;

interface SchoolStaffingRecord {
  seq_no: number;
  is_flagged: boolean;
  school_code: string;
  school_name: string;
  location_raw: string;
  subdistrict: string;
  district: string;
  province: string;
  school_size: string;
  school_type: string;
  project_name: string;
  special_feature: string;
  students_count: number;
  classrooms_count: number;
  actual_director: number;
  actual_deputy: number;
  actual_teacher: number;
  actual_total: number;
  j18_paid_director: number;
  j18_paid_deputy: number;
  j18_paid_teacher: number;
  j18_paid_total: number;
  j18_calc_director: number;
  j18_calc_deputy: number;
  j18_calc_teacher: number;
  j18_calc_total: number;
  criteria_director: number;
  criteria_deputy: number;
  criteria_teacher: number;
  criteria_total: number;
  diff_director: number;
  diff_deputy: number;
  diff_teacher: number;
  diff_total: number;
  diff_teacher_pct: number;
  retire_director: number;
  retire_deputy: number;
  retire_teacher: number;
  retire_total: number;
  post_retire_director: number;
  post_retire_deputy: number;
  post_retire_teacher: number;
  post_retire_total: number;
  post_retire_pct: number;
  secondment_out: number;
  secondment_in: number;
  royal_decree_teacher: number;
  contract_teacher: number;
}

interface ReportPeriod {
  id: string;
  buddhist_year: number;
  month_number: number;
  month_label: string;
  period_note: string;
  source_filename: string;
  total_schools: number;
  total_students: number;
  total_classrooms: number;
  total_actual_staff: number;
  total_j18_calc: number;
  total_criteria: number;
  net_diff: number;
  net_diff_pct: number;
  created_at?: string;
  updated_at?: string;
}

interface SupabaseStatus {
  configured: boolean;
  tablesReady: boolean;
  studentBreakdownReady?: boolean;
  mode: 'supabase' | 'preview';
  message: string;
  diagnostic?: {
    urlValid: boolean;
    urlNote: string;
    keySource: 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY' | 'none';
    keyKind: string;
    httpStatus?: number;
    errorCode?: string;
    errorDetail?: string;
  };
}

const FALLBACK_SCHEMA_SQL = `-- Supabase PostgreSQL Schema for สพป.แม่ฮ่องสอน เขต 1 Staffing Dashboard
-- Run this SQL once in your Supabase Project -> SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.report_periods (
  id uuid primary key default gen_random_uuid(),
  buddhist_year integer not null check (buddhist_year >= 2500 and buddhist_year <= 2700),
  month_number integer not null check (month_number >= 1 and month_number <= 12),
  month_label text not null,
  period_note text not null default '',
  source_filename text not null,
  total_schools integer not null default 0,
  total_students integer not null default 0,
  total_classrooms integer not null default 0,
  total_actual_staff integer not null default 0,
  total_j18_calc integer not null default 0,
  total_criteria integer not null default 0,
  net_diff integer not null default 0,
  net_diff_pct numeric(7,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_report_periods_year_month unique (buddhist_year, month_number)
);

create table if not exists public.school_staffing_records (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.report_periods(id) on delete cascade,
  seq_no integer not null,
  is_flagged boolean not null default false,
  school_code text not null,
  school_name text not null,
  location_raw text not null default '',
  subdistrict text not null default '',
  district text not null default '',
  province text not null default '',
  school_size text not null default '',
  school_type text not null default '',
  project_name text not null default '',
  special_feature text not null default '',
  students_count integer not null default 0,
  classrooms_count integer not null default 0,
  actual_director integer not null default 0,
  actual_deputy integer not null default 0,
  actual_teacher integer not null default 0,
  actual_total integer not null default 0,
  j18_paid_director integer not null default 0,
  j18_paid_deputy integer not null default 0,
  j18_paid_teacher integer not null default 0,
  j18_paid_total integer not null default 0,
  j18_calc_director integer not null default 0,
  j18_calc_deputy integer not null default 0,
  j18_calc_teacher integer not null default 0,
  j18_calc_total integer not null default 0,
  criteria_director integer not null default 0,
  criteria_deputy integer not null default 0,
  criteria_teacher integer not null default 0,
  criteria_total integer not null default 0,
  diff_director integer not null default 0,
  diff_deputy integer not null default 0,
  diff_teacher integer not null default 0,
  diff_total integer not null default 0,
  diff_teacher_pct numeric(7,2) not null default 0,
  retire_director integer not null default 0,
  retire_deputy integer not null default 0,
  retire_teacher integer not null default 0,
  retire_total integer not null default 0,
  post_retire_director integer not null default 0,
  post_retire_deputy integer not null default 0,
  post_retire_teacher integer not null default 0,
  post_retire_total integer not null default 0,
  post_retire_pct numeric(7,2) not null default 0,
  secondment_out integer not null default 0,
  secondment_in integer not null default 0,
  royal_decree_teacher integer not null default 0,
  contract_teacher integer not null default 0,
  created_at timestamptz not null default now(),
  constraint uq_period_school_code unique (period_id, school_code)
);

create index if not exists idx_school_records_period_id on public.school_staffing_records(period_id);
create index if not exists idx_school_records_district on public.school_staffing_records(district);
create index if not exists idx_school_records_school_code on public.school_staffing_records(school_code);
create index if not exists idx_report_periods_sort on public.report_periods(buddhist_year desc, month_number desc);

alter table public.report_periods enable row level security;
alter table public.school_staffing_records enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.report_periods to service_role;
grant select, insert, update, delete on table public.school_staffing_records to service_role;
grant usage, select on all sequences in schema public to service_role;

drop policy if exists "Allow read report_periods" on public.report_periods;
drop policy if exists "Allow read school_staffing_records" on public.school_staffing_records;
revoke all on table public.report_periods from anon;
revoke all on table public.school_staffing_records from anon;

create table if not exists public.school_student_breakdowns (
  id uuid primary key default gen_random_uuid(),
  semester text not null default '2569-2',
  district_code text not null default '58010000',
  district_name text not null default '',
  school_code text not null,
  school_name text not null,
  source_filename text not null default '',
  k0_students integer not null default 0,
  k0_rooms integer not null default 0,
  k1_students integer not null default 0,
  k1_rooms integer not null default 0,
  k2_students integer not null default 0,
  k2_rooms integer not null default 0,
  p1_students integer not null default 0,
  p1_rooms integer not null default 0,
  p2_students integer not null default 0,
  p2_rooms integer not null default 0,
  p3_students integer not null default 0,
  p3_rooms integer not null default 0,
  p4_students integer not null default 0,
  p4_rooms integer not null default 0,
  p5_students integer not null default 0,
  p5_rooms integer not null default 0,
  p6_students integer not null default 0,
  p6_rooms integer not null default 0,
  m1_students integer not null default 0,
  m1_rooms integer not null default 0,
  m2_students integer not null default 0,
  m2_rooms integer not null default 0,
  m3_students integer not null default 0,
  m3_rooms integer not null default 0,
  m4_students integer not null default 0,
  m4_rooms integer not null default 0,
  m5_students integer not null default 0,
  m5_rooms integer not null default 0,
  m6_students integer not null default 0,
  m6_rooms integer not null default 0,
  total_male integer not null default 0,
  total_female integer not null default 0,
  total_students integer not null default 0,
  total_rooms integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_student_breakdown_semester_school unique (semester, school_code)
);

create index if not exists idx_student_breakdowns_semester on public.school_student_breakdowns(semester);
create index if not exists idx_student_breakdowns_school_code on public.school_student_breakdowns(school_code);

alter table public.school_student_breakdowns enable row level security;

grant select, insert, update, delete on table public.school_student_breakdowns to service_role;
revoke all on table public.school_student_breakdowns from anon;
`;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return '';
  let val = raw.trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  return val;
}

function inspectSupabaseConfig() {
  let url = cleanEnvValue(process.env.SUPABASE_URL);
  if (url.startsWith('SUPABASE_URL=')) {
    url = cleanEnvValue(url.slice('SUPABASE_URL='.length));
  }
  url = url.replace(/\/+$/, '');

  const serviceKeyRaw = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKeyRaw = cleanEnvValue(process.env.SUPABASE_ANON_KEY);

  let keySource: 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY' | 'none' = 'none';
  let key = '';
  if (serviceKeyRaw) {
    keySource = 'SUPABASE_SERVICE_ROLE_KEY';
    key = serviceKeyRaw.startsWith('SUPABASE_SERVICE_ROLE_KEY=')
      ? cleanEnvValue(serviceKeyRaw.slice('SUPABASE_SERVICE_ROLE_KEY='.length))
      : serviceKeyRaw;
  } else if (anonKeyRaw) {
    keySource = 'SUPABASE_ANON_KEY';
    key = anonKeyRaw.startsWith('SUPABASE_ANON_KEY=')
      ? cleanEnvValue(anonKeyRaw.slice('SUPABASE_ANON_KEY='.length))
      : anonKeyRaw;
  }

  let urlValid = false;
  let urlNote = 'ยังไม่ได้ระบุ SUPABASE_URL';
  let urlProjectRef = '';
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')) {
        urlValid = true;
        urlProjectRef = parsed.hostname.split('.')[0] || '';
        urlNote = `รูปแบบ URL ถูกต้อง (Project: ${urlProjectRef})`;
      } else if (parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:') {
        urlNote =
          'ค่าที่ใส่เป็น PostgreSQL Connection String ไม่ใช่ Project URL (ต้องขึ้นต้นด้วย https://...supabase.co)';
      } else {
        urlNote = `URL ต้องเป็น https://<project-ref>.supabase.co (พบ ${parsed.protocol}//${parsed.hostname})`;
      }
    } catch {
      urlNote = 'รูปแบบ SUPABASE_URL ไม่ใช่ URL ที่ถูกต้อง';
    }
  }

  let keyKind = 'none';
  let jwtRef = '';
  let jwtRole = '';
  if (key) {
    if (key.startsWith('eyJ') && key.split('.').length === 3) {
      try {
        const payload = JSON.parse(
          Buffer.from(key.split('.')[1], 'base64url').toString('utf8')
        ) as { role?: string; ref?: string };
        jwtRole = payload.role || 'unknown';
        jwtRef = payload.ref || '';
        keyKind = `jwt (role=${jwtRole})`;
      } catch {
        keyKind = 'jwt (malformed)';
      }
    } else if (key.startsWith('sb_secret_')) {
      keyKind = 'sb_secret';
    } else if (key.startsWith('sb_publishable_')) {
      keyKind = 'sb_publishable (ห้ามใช้คีย์นี้แทน service_role)';
    } else {
      keyKind = `unknown format (length=${key.length})`;
    }
  }

  const refMismatch = Boolean(urlProjectRef && jwtRef && urlProjectRef !== jwtRef);

  return {
    url,
    key,
    urlValid,
    urlNote,
    keySource,
    keyKind,
    jwtRole,
    refMismatch,
    urlProjectRef,
    jwtRef,
  };
}

function getSupabaseClient(): SupabaseClient | null {
  const cfg = inspectSupabaseConfig();
  if (!cfg.url || !cfg.key || !cfg.urlValid) {
    return null;
  }
  return createClient(cfg.url, cfg.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function checkSupabaseStatus(): Promise<SupabaseStatus> {
  const cfg = inspectSupabaseConfig();

  if (!cfg.url && !cfg.key) {
    return {
      configured: false,
      tablesReady: false,
      mode: 'preview',
      message:
        'ยังไม่ได้ตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY (กรุณาตั้งค่า Environment Variables ในเซิร์ฟเวอร์หรือ Vercel แล้ว Redeploy)',
      diagnostic: {
        urlValid: false,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  }

  if (!cfg.urlValid || !cfg.key) {
    return {
      configured: true,
      tablesReady: false,
      mode: 'preview',
      message: !cfg.urlValid
        ? cfg.urlNote
        : 'พบ SUPABASE_URL แล้ว แต่ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY',
      diagnostic: {
        urlValid: cfg.urlValid,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  }

  if (cfg.refMismatch) {
    return {
      configured: true,
      tablesReady: false,
      mode: 'preview',
      message: `Project ID ใน SUPABASE_URL (${cfg.urlProjectRef}) ไม่ตรงกับคีย์ (${cfg.jwtRef}) กรุณาตรวจสอบว่าทั้งสองค่ามาจากโปรเจกต์เดียวกัน`,
      diagnostic: {
        urlValid: cfg.urlValid,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  }

  const client = getSupabaseClient()!;

  try {
    const { error, status } = await client.from('report_periods').select('id').limit(1);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const code = (error.code || '').toUpperCase();
      const isMissingTable =
        code === '42P01' ||
        code === 'PGRST205' ||
        msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        msg.includes('could not find the table');

      if (isMissingTable) {
        return {
          configured: true,
          tablesReady: false,
          mode: 'preview',
          message:
            'เชื่อมต่อ Supabase แล้ว แต่ยังไม่พบตารางข้อมูล กรุณารันคำสั่ง SQL ในไฟล์ supabase/schema.sql',
          diagnostic: {
            urlValid: cfg.urlValid,
            urlNote: cfg.urlNote,
            keySource: cfg.keySource,
            keyKind: cfg.keyKind,
            httpStatus: status,
            errorCode: error.code,
            errorDetail: error.message,
          },
        };
      }

      if (
        status === 401 ||
        status === 403 ||
        code === '42501' ||
        msg.includes('jwt') ||
        msg.includes('api key')
      ) {
        const isPublishableOrAnon =
          cfg.jwtRole === 'anon' || cfg.keyKind.startsWith('sb_publishable');
        const isMissingGrant =
          !isPublishableOrAnon && (code === '42501' || msg.includes('permission denied'));

        const customMessage = isPublishableOrAnon
          ? `คีย์ที่ใส่เป็น anon/publishable key ไม่ใช่ service_role/secret key: ${error.message}`
          : isMissingGrant
            ? 'คีย์ sb_secret_ ถูกต้องแล้ว แต่ยังไม่มีสิทธิ์ GRANT บนตารางข้อมูล กรุณารันคำสั่ง SQL ล่าสุดในหน้าต่างตั้งค่า Supabase (เพิ่มสิทธิ์ GRANT ให้ service_role)'
            : `พบตัวแปร Supabase แล้ว แต่คีย์เชื่อมต่อไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง: ${error.message}`;

        return {
          configured: true,
          tablesReady: false,
          mode: 'preview',
          message: customMessage,
          diagnostic: {
            urlValid: cfg.urlValid,
            urlNote: cfg.urlNote,
            keySource: cfg.keySource,
            keyKind: cfg.keyKind,
            httpStatus: status,
            errorCode: error.code,
            errorDetail: error.message,
          },
        };
      }

      return {
        configured: true,
        tablesReady: false,
        mode: 'preview',
        message: `ไม่สามารถติดต่อฐานข้อมูล Supabase ได้ (${error.code || status || 'ERROR'}: ${error.message})`,
        diagnostic: {
          urlValid: cfg.urlValid,
          urlNote: cfg.urlNote,
          keySource: cfg.keySource,
          keyKind: cfg.keyKind,
          httpStatus: status,
          errorCode: error.code,
          errorDetail: error.message,
        },
      };
    }

    const { error: bdErr } = await client
      .from('school_student_breakdowns')
      .select('id')
      .limit(1);

    return {
      configured: true,
      tablesReady: true,
      studentBreakdownReady: !bdErr,
      mode: 'supabase',
      message: 'เชื่อมต่อฐานข้อมูล Supabase พร้อมใช้งาน',
      diagnostic: {
        urlValid: cfg.urlValid,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  } catch (err) {
    return {
      configured: true,
      tablesReady: false,
      mode: 'preview',
      message: `ไม่สามารถเชื่อมต่อไปยัง SUPABASE_URL ได้: ${
        err instanceof Error ? err.message : 'Network error'
      }`,
      diagnostic: {
        urlValid: cfg.urlValid,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  }
}

function sanitizeInt(value: unknown, min = -100000, max = 1000000): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function sanitizeFloat(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Number(Math.max(-10000, Math.min(10000, n)).toFixed(2));
}

function sanitizeText(value: unknown, maxLen = 250): string {
  return String(value ?? '').trim().slice(0, maxLen);
}

function sanitizeRecords(rawRecords: unknown[]): SchoolStaffingRecord[] {
  return rawRecords.map((item, idx) => {
    const r = (item ?? {}) as Record<string, unknown>;
    return {
      seq_no: sanitizeInt(r.seq_no, 1, 100000) || idx + 1,
      is_flagged: Boolean(r.is_flagged),
      school_code: sanitizeText(r.school_code, 32),
      school_name: sanitizeText(r.school_name, 200),
      location_raw: sanitizeText(r.location_raw, 200),
      subdistrict: sanitizeText(r.subdistrict, 100),
      district: sanitizeText(r.district, 100),
      province: sanitizeText(r.province, 100),
      school_size: sanitizeText(r.school_size, 64),
      school_type: sanitizeText(r.school_type, 64),
      project_name: sanitizeText(r.project_name, 250),
      special_feature: sanitizeText(r.special_feature, 120),

      students_count: sanitizeInt(r.students_count, 0),
      classrooms_count: sanitizeInt(r.classrooms_count, 0),

      actual_director: sanitizeInt(r.actual_director, 0),
      actual_deputy: sanitizeInt(r.actual_deputy, 0),
      actual_teacher: sanitizeInt(r.actual_teacher, 0),
      actual_total: sanitizeInt(r.actual_total, 0),

      j18_paid_director: sanitizeInt(r.j18_paid_director, 0),
      j18_paid_deputy: sanitizeInt(r.j18_paid_deputy, 0),
      j18_paid_teacher: sanitizeInt(r.j18_paid_teacher, 0),
      j18_paid_total: sanitizeInt(r.j18_paid_total, 0),

      j18_calc_director: sanitizeInt(r.j18_calc_director, 0),
      j18_calc_deputy: sanitizeInt(r.j18_calc_deputy, 0),
      j18_calc_teacher: sanitizeInt(r.j18_calc_teacher, 0),
      j18_calc_total: sanitizeInt(r.j18_calc_total, 0),

      criteria_director: sanitizeInt(r.criteria_director, 0),
      criteria_deputy: sanitizeInt(r.criteria_deputy, 0),
      criteria_teacher: sanitizeInt(r.criteria_teacher, 0),
      criteria_total: sanitizeInt(r.criteria_total, 0),

      diff_director: sanitizeInt(r.diff_director),
      diff_deputy: sanitizeInt(r.diff_deputy),
      diff_teacher: sanitizeInt(r.diff_teacher),
      diff_total: sanitizeInt(r.diff_total),
      diff_teacher_pct: sanitizeFloat(r.diff_teacher_pct),

      retire_director: sanitizeInt(r.retire_director, 0),
      retire_deputy: sanitizeInt(r.retire_deputy, 0),
      retire_teacher: sanitizeInt(r.retire_teacher, 0),
      retire_total: sanitizeInt(r.retire_total, 0),

      post_retire_director: sanitizeInt(r.post_retire_director),
      post_retire_deputy: sanitizeInt(r.post_retire_deputy),
      post_retire_teacher: sanitizeInt(r.post_retire_teacher),
      post_retire_total: sanitizeInt(r.post_retire_total),
      post_retire_pct: sanitizeFloat(r.post_retire_pct),

      secondment_out: sanitizeInt(r.secondment_out, 0),
      secondment_in: sanitizeInt(r.secondment_in, 0),
      royal_decree_teacher: sanitizeInt(r.royal_decree_teacher, 0),
      contract_teacher: sanitizeInt(r.contract_teacher, 0),
    };
  });
}

function sanitizeStudentBreakdowns(
  rawRecords: unknown[],
  semester: string,
  sourceFilename: string
) {
  return rawRecords.map((item) => {
    const r = (item ?? {}) as Record<string, unknown>;
    return {
      semester,
      district_code: sanitizeText(r.district_code, 32) || '58010000',
      district_name: sanitizeText(r.district_name, 150) || 'สพป.แม่ฮ่องสอน เขต 1',
      school_code: sanitizeText(r.school_code, 32),
      school_name: sanitizeText(r.school_name, 200),
      source_filename: sourceFilename,

      k0_students: sanitizeInt(r.k0_students, 0),
      k0_rooms: sanitizeInt(r.k0_rooms, 0),
      k1_students: sanitizeInt(r.k1_students, 0),
      k1_rooms: sanitizeInt(r.k1_rooms, 0),
      k2_students: sanitizeInt(r.k2_students, 0),
      k2_rooms: sanitizeInt(r.k2_rooms, 0),

      p1_students: sanitizeInt(r.p1_students, 0),
      p1_rooms: sanitizeInt(r.p1_rooms, 0),
      p2_students: sanitizeInt(r.p2_students, 0),
      p2_rooms: sanitizeInt(r.p2_rooms, 0),
      p3_students: sanitizeInt(r.p3_students, 0),
      p3_rooms: sanitizeInt(r.p3_rooms, 0),
      p4_students: sanitizeInt(r.p4_students, 0),
      p4_rooms: sanitizeInt(r.p4_rooms, 0),
      p5_students: sanitizeInt(r.p5_students, 0),
      p5_rooms: sanitizeInt(r.p5_rooms, 0),
      p6_students: sanitizeInt(r.p6_students, 0),
      p6_rooms: sanitizeInt(r.p6_rooms, 0),

      m1_students: sanitizeInt(r.m1_students, 0),
      m1_rooms: sanitizeInt(r.m1_rooms, 0),
      m2_students: sanitizeInt(r.m2_students, 0),
      m2_rooms: sanitizeInt(r.m2_rooms, 0),
      m3_students: sanitizeInt(r.m3_students, 0),
      m3_rooms: sanitizeInt(r.m3_rooms, 0),
      m4_students: sanitizeInt(r.m4_students, 0),
      m4_rooms: sanitizeInt(r.m4_rooms, 0),
      m5_students: sanitizeInt(r.m5_students, 0),
      m5_rooms: sanitizeInt(r.m5_rooms, 0),
      m6_students: sanitizeInt(r.m6_students, 0),
      m6_rooms: sanitizeInt(r.m6_rooms, 0),

      total_male: sanitizeInt(r.total_male, 0),
      total_female: sanitizeInt(r.total_female, 0),
      total_students: sanitizeInt(r.total_students, 0),
      total_rooms: sanitizeInt(r.total_rooms, 0),
      updated_at: new Date().toISOString(),
    };
  });
}

function verifySameOrigin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }
  const origin = req.headers.origin;
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host;
  const host = rawHost ? String(rawHost).split(',')[0].trim() : '';
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        res.status(403).json({ error: 'ไม่อนุญาตให้ส่งคำขอข้ามโดเมน' });
        return;
      }
    } catch {
      res.status(403).json({ error: 'รูปแบบ Origin ไม่ถูกต้อง' });
      return;
    }
  }
  next();
}

export function createApiApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use('/api', verifySameOrigin);
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/status', async (_req, res) => {
    try {
      const status = await checkSupabaseStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({
        configured: false,
        tablesReady: false,
        mode: 'preview',
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ',
      });
    }
  });

  app.get('/api/schema-sql', (_req, res) => {
    try {
      const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        res.json({ sql });
        return;
      }
    } catch {
      // Fallback to embedded SQL on serverless environments
    }
    res.json({ sql: FALLBACK_SCHEMA_SQL });
  });

  app.get('/api/periods', async (_req, res) => {
    try {
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.json({ mode: 'preview', periods: [] });
        return;
      }

      const client = getSupabaseClient()!;
      const { data, error } = await client
        .from('report_periods')
        .select('*')
        .order('buddhist_year', { ascending: false })
        .order('month_number', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      res.json({ mode: 'supabase', periods: data ?? [] });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ไม่สามารถโหลดรายการงวดข้อมูลได้',
      });
    }
  });

  app.delete('/api/periods', async (_req, res) => {
    try {
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.status(503).json({
          error: 'ยังไม่ได้เชื่อมต่อฐานข้อมูล Supabase หรือยังไม่ได้สร้างตารางข้อมูล',
        });
        return;
      }

      const client = getSupabaseClient()!;
      const { error } = await client
        .from('report_periods')
        .delete()
        .not('id', 'is', null);

      if (error) {
        throw new Error(error.message);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ไม่สามารถลบข้อมูลทั้งหมดได้',
      });
    }
  });

  app.get('/api/periods/:id/records', async (req, res) => {
    try {
      const { id } = req.params;
      const status = await checkSupabaseStatus();

      if (!status.tablesReady) {
        res.json({ mode: 'preview', records: [] });
        return;
      }

      if (!UUID_REGEX.test(id)) {
        res.status(400).json({ error: 'รหัสงวดข้อมูลไม่ถูกต้อง' });
        return;
      }

      const client = getSupabaseClient()!;
      const { data, error } = await client
        .from('school_staffing_records')
        .select('*')
        .eq('period_id', id)
        .order('seq_no', { ascending: true })
        .range(0, 4999);

      if (error) {
        throw new Error(error.message);
      }

      res.json({ mode: 'supabase', records: data ?? [] });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลโรงเรียนได้',
      });
    }
  });

  app.post('/api/periods', async (req, res) => {
    try {
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.status(503).json({
          error:
            'ยังไม่ได้เชื่อมต่อ Supabase หรือยังไม่ได้สร้างตารางข้อมูล กรุณาตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY และรัน supabase/schema.sql ก่อนบันทึกงวดใหม่',
        });
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const buddhistYear = Number(body.buddhist_year);
      const monthNumber = Number(body.month_number);
      const periodNote = sanitizeText(body.period_note, 200);
      const sourceFilename = sanitizeText(body.source_filename, 255) || 'upload.csv';
      const overwrite = Boolean(body.overwrite);
      const rawRecords = body.records;

      if (!Number.isInteger(buddhistYear) || buddhistYear < 2500 || buddhistYear > 2700) {
        res.status(400).json({ error: 'ปี พ.ศ. ต้องอยู่ระหว่าง 2500 - 2700' });
        return;
      }

      if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        res.status(400).json({ error: 'เดือนต้องอยู่ระหว่าง 1 - 12' });
        return;
      }

      if (!Array.isArray(rawRecords) || rawRecords.length === 0 || rawRecords.length > 5000) {
        res.status(400).json({ error: 'ไม่พบข้อมูลโรงเรียนที่ถูกต้องในไฟล์ที่นำเข้า' });
        return;
      }

      const records = sanitizeRecords(rawRecords).filter(
        (r) => r.school_code.length > 0 && r.school_name.length > 0
      );

      if (records.length === 0) {
        res.status(400).json({ error: 'ไม่พบรายการโรงเรียนที่สามารถบันทึกได้' });
        return;
      }

      let totalStudents = 0;
      let totalClassrooms = 0;
      let totalActualStaff = 0;
      let totalJ18Calc = 0;
      let totalCriteria = 0;
      let netDiff = 0;
      let diffTeacher = 0;
      let criteriaTeacher = 0;

      for (const r of records) {
        totalStudents += r.students_count;
        totalClassrooms += r.classrooms_count;
        totalActualStaff += r.actual_total;
        totalJ18Calc += r.j18_calc_total;
        totalCriteria += r.criteria_total;
        netDiff += r.diff_total;
        diffTeacher += r.diff_teacher;
        criteriaTeacher += r.criteria_teacher;
      }

      const netDiffPct =
        criteriaTeacher > 0 ? Number(((diffTeacher / criteriaTeacher) * 100).toFixed(2)) : 0;
      const monthLabel =
        THAI_MONTHS.find((m) => m.value === monthNumber)?.label ?? String(monthNumber);

      const client = getSupabaseClient()!;

      const { data: existing } = await client
        .from('report_periods')
        .select('id')
        .eq('buddhist_year', buddhistYear)
        .eq('month_number', monthNumber)
        .maybeSingle();

      if (existing && !overwrite) {
        res.status(409).json({
          error: `มีข้อมูลประจำเดือน${monthLabel} พ.ศ. ${buddhistYear} อยู่ในฐานข้อมูลแล้ว`,
          exists: true,
        });
        return;
      }

      let periodRow: ReportPeriod;
      if (existing) {
        const { data: updated, error: updErr } = await client
          .from('report_periods')
          .update({
            month_label: monthLabel,
            period_note: periodNote,
            source_filename: sourceFilename,
            total_schools: records.length,
            total_students: totalStudents,
            total_classrooms: totalClassrooms,
            total_actual_staff: totalActualStaff,
            total_j18_calc: totalJ18Calc,
            total_criteria: totalCriteria,
            net_diff: netDiff,
            net_diff_pct: netDiffPct,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updErr || !updated) {
          throw new Error(updErr?.message || 'อัปเดตงวดข้อมูลไม่สำเร็จ');
        }
        periodRow = updated as ReportPeriod;

        const { error: delErr } = await client
          .from('school_staffing_records')
          .delete()
          .eq('period_id', periodRow.id);
        if (delErr) {
          throw new Error(delErr.message);
        }
      } else {
        const { data: inserted, error: insErr } = await client
          .from('report_periods')
          .insert({
            buddhist_year: buddhistYear,
            month_number: monthNumber,
            month_label: monthLabel,
            period_note: periodNote,
            source_filename: sourceFilename,
            total_schools: records.length,
            total_students: totalStudents,
            total_classrooms: totalClassrooms,
            total_actual_staff: totalActualStaff,
            total_j18_calc: totalJ18Calc,
            total_criteria: totalCriteria,
            net_diff: netDiff,
            net_diff_pct: netDiffPct,
          })
          .select()
          .single();

        if (insErr || !inserted) {
          throw new Error(insErr?.message || 'สร้างงวดข้อมูลใหม่ไม่สำเร็จ');
        }
        periodRow = inserted as ReportPeriod;
      }

      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize).map((r) => ({
          ...r,
          period_id: periodRow.id,
        }));
        const { error: recErr } = await client.from('school_staffing_records').insert(batch);
        if (recErr) {
          throw new Error(recErr.message);
        }
      }

      res.status(201).json({ period: periodRow });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'บันทึกข้อมูลลง Supabase ไม่สำเร็จ',
      });
    }
  });

  app.delete('/api/periods/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.status(503).json({ error: 'ไม่สามารถลบข้อมูลในโหมดตัวอย่างได้' });
        return;
      }

      if (!UUID_REGEX.test(id)) {
        res.status(400).json({ error: 'รหัสงวดข้อมูลไม่ถูกต้อง' });
        return;
      }

      const client = getSupabaseClient()!;
      const { error } = await client.from('report_periods').delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ลบงวดข้อมูลไม่สำเร็จ',
      });
    }
  });

  app.delete('/api/years/:year', async (req, res) => {
    try {
      const year = Number(req.params.year);
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.status(503).json({ error: 'ไม่สามารถลบข้อมูลในโหมดตัวอย่างได้' });
        return;
      }

      if (!Number.isInteger(year) || year < 2500 || year > 2700) {
        res.status(400).json({ error: 'ปี พ.ศ. ไม่ถูกต้อง' });
        return;
      }

      const client = getSupabaseClient()!;
      const { error } = await client
        .from('report_periods')
        .delete()
        .eq('buddhist_year', year);

      if (error) {
        throw new Error(error.message);
      }
      res.json({ ok: true, deletedYear: year });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ลบข้อมูลรายปีไม่สำเร็จ',
      });
    }
  });

  app.get('/api/student-breakdowns', async (req, res) => {
    try {
      const semester = sanitizeText(req.query.semester, 32) || '2569-2';
      const status = await checkSupabaseStatus();

      if (!status.tablesReady || !status.studentBreakdownReady) {
        res.json({
          mode: 'preview',
          studentBreakdownReady: false,
          seeded: false,
          semester: '2569-2',
          records: SCHOOLMIS_2569_2_RECORDS,
        });
        return;
      }

      const client = getSupabaseClient()!;
      const { data, error } = await client
        .from('school_student_breakdowns')
        .select('*')
        .eq('semester', semester)
        .order('school_code', { ascending: true })
        .range(0, 4999);

      if (error) {
        throw new Error(error.message);
      }

      if ((data ?? []).length === 0 && semester === '2569-2') {
        const seedPayload = SCHOOLMIS_2569_2_RECORDS.map((r) => ({
          ...r,
          updated_at: new Date().toISOString(),
        }));
        const { error: seedErr } = await client
          .from('school_student_breakdowns')
          .upsert(seedPayload, { onConflict: 'semester,school_code' });

        if (seedErr) {
          throw new Error(seedErr.message);
        }

        const { data: seededRows, error: seededFetchErr } = await client
          .from('school_student_breakdowns')
          .select('*')
          .eq('semester', semester)
          .order('school_code', { ascending: true })
          .range(0, 4999);

        if (seededFetchErr) {
          throw new Error(seededFetchErr.message);
        }

        res.json({
          mode: 'supabase',
          studentBreakdownReady: true,
          seeded: true,
          semester,
          records: seededRows ?? SCHOOLMIS_2569_2_RECORDS,
        });
        return;
      }

      res.json({
        mode: 'supabase',
        studentBreakdownReady: true,
        seeded: false,
        semester,
        records: data ?? [],
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลนักเรียนแยกชั้นได้',
      });
    }
  });

  app.post('/api/student-breakdowns', async (req, res) => {
    try {
      const status = await checkSupabaseStatus();
      if (!status.tablesReady || !status.studentBreakdownReady) {
        res.status(503).json({
          error:
            'ยังไม่ได้สร้างตาราง school_student_breakdowns ใน Supabase กรุณารันคำสั่ง SQL ล่าสุดใน Supabase SQL Editor ก่อนบันทึก',
        });
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const semester = sanitizeText(body.semester, 32) || '2569-2';
      const sourceFilename =
        sanitizeText(body.source_filename, 255) || 'schoolmis.csv';
      const rawRecords = body.records;

      if (!Array.isArray(rawRecords) || rawRecords.length === 0 || rawRecords.length > 5000) {
        res.status(400).json({ error: 'ไม่พบข้อมูลนักเรียนแยกชั้นในไฟล์ที่นำเข้า' });
        return;
      }

      const records = sanitizeStudentBreakdowns(
        rawRecords,
        semester,
        sourceFilename
      ).filter((r) => r.school_code.length > 0 && r.school_name.length > 0);

      if (records.length === 0) {
        res.status(400).json({ error: 'ไม่พบรายการโรงเรียนที่ถูกต้องในไฟล์ SchoolMIS' });
        return;
      }

      const client = getSupabaseClient()!;
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error: upsertErr } = await client
          .from('school_student_breakdowns')
          .upsert(batch, { onConflict: 'semester,school_code' });
        if (upsertErr) {
          throw new Error(upsertErr.message);
        }
      }

      const { data: savedRows, error: fetchErr } = await client
        .from('school_student_breakdowns')
        .select('*')
        .eq('semester', semester)
        .order('school_code', { ascending: true })
        .range(0, 4999);

      if (fetchErr) {
        throw new Error(fetchErr.message);
      }

      res.status(201).json({
        ok: true,
        mode: 'supabase',
        semester,
        count: records.length,
        records: savedRows ?? records,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'บันทึกข้อมูลนักเรียนแยกชั้นลง Supabase ไม่สำเร็จ',
      });
    }
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'ไม่พบ API Endpoint ที่ร้องขอ' });
  });

  return app;
}

const app = createApiApp();
export default app;
