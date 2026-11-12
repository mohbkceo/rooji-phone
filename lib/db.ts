import {DatabaseSync, type SQLInputValue} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {schema} from './schema.ts';

export const dataPath = () => resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || './data');
let connection: DatabaseSync | undefined;
export function db() {
  if (connection) return connection;
  mkdirSync(dataPath(), {recursive:true,mode:0o700});
  const conn = new DatabaseSync(resolve(dataPath(), 'roudji.sqlite'));
  conn.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
  const version = Number(conn.prepare('PRAGMA user_version').get()?.user_version);
  if (version > 2) { conn.close(); throw Error('Version de base incompatible'); }
  if (!version) {
    conn.exec('BEGIN IMMEDIATE');
    try { if (Number(conn.prepare('PRAGMA user_version').get()?.user_version) === 0) conn.exec(schema); conn.exec('COMMIT'); }
    catch (error) { conn.exec('ROLLBACK'); conn.close(); throw error; }
  }
  if (version < 2) {
    conn.exec('BEGIN IMMEDIATE');
    try {
      if (Number(conn.prepare('PRAGMA user_version').get()?.user_version) === 1) {
        conn.exec("ALTER TABLE variants ADD COLUMN color TEXT NOT NULL DEFAULT ''; ALTER TABLE variants ADD COLUMN size TEXT NOT NULL DEFAULT ''; ALTER TABLE variants ADD COLUMN storage TEXT NOT NULL DEFAULT ''; PRAGMA user_version=2");
      }
      conn.exec('COMMIT');
    } catch (error) { conn.exec('ROLLBACK'); conn.close(); throw error; }
  }
  connection = conn;
  return conn;
}

// SQLite rows have null prototypes. Plain records can also cross the React server boundary.
export function get<T>(sql:string,...params:SQLInputValue[]):T|undefined {
  const row=db().prepare(sql).get(...params);
  return row?{...row} as T:undefined;
}
export const all = <T>(sql:string,...params:SQLInputValue[]) => db().prepare(sql).all(...params).map(row=>({...row}) as T);
export const run = (sql:string,...params:SQLInputValue[]) => db().prepare(sql).run(...params);
export function transaction<T>(work:()=>T):T {
  db().exec('BEGIN IMMEDIATE');
  try { const result = work(); db().exec('COMMIT'); return result; }
  catch(error) {db().exec('ROLLBACK'); throw error;}
}
