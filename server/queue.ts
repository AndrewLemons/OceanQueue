import path from "node:path";
import fs from "fs-extra";
import config from "./config";
import sqlite from "better-sqlite3";

const db = new sqlite(`${config.dataPath}/index`);

db.exec(`
	CREATE TABLE IF NOT EXISTS QueueItems (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		printer TEXT NOT NULL,
		fileName TEXT NOT NULL,
		hash TEXT NOT NULL,
		state TEXT NOT NULL,
		idx INTEGER NOT NULL
	);
`);

export class Queue {
	printerSerial: string;
	items: QueueItem[];

	constructor(printerSerial: string) {
		this.printerSerial = printerSerial;
		this.items = [];

		const rows = db
			.prepare(
				`
			SELECT * FROM QueueItems
			WHERE printer = ?
			ORDER BY idx ASC;
		`,
			)
			.all(this.printerSerial) as IQueueItemRow[];

		rows.forEach((row) => {
			this.items.push(new QueueItem(row.id, row.fileName, row.hash, row.state));
		});
	}

	add(
		fileName: string,
		hash: string,
		state: QueueItemState = QueueItemState.QUEUED,
	): QueueItem {
		const idx = this.items.length;
		const result = db
			.prepare(
				`
			INSERT INTO QueueItems (printer, fileName, hash, state, idx)
			VALUES (?, ?, ?, ?, ?);
		`,
			)
			.run(this.printerSerial, fileName, hash, state, idx);

		const queueItem = new QueueItem(
			result.lastInsertRowid as number,
			fileName,
			hash,
			state,
		);
		this.items.push(queueItem);
		return queueItem;
	}

	remove(queueItem: QueueItem): void {
		const index = this.items.indexOf(queueItem);
		if (index === -1) {
			return;
		}

		db.prepare(
			`
			DELETE FROM QueueItems
			WHERE id = ?;
		`,
		).run(queueItem.id);

		this.items.splice(index, 1);
	}

	update(queueItem: QueueItem): void {
		db.prepare(
			`
			UPDATE QueueItems
			SET state = ?, idx = ?
			WHERE id = ?;
		`,
		).run(queueItem.state, this.items.indexOf(queueItem), queueItem.id);
	}

	getAll(): QueueItem[] {
		return this.items;
	}
}

export class QueueItem {
	id: number;
	fileName: string;
	hash: string;
	state: QueueItemState;

	constructor(
		id: number,
		fileName: string,
		hash: string,
		state: QueueItemState,
	) {
		this.id = id;
		this.fileName = fileName;
		this.hash = hash;
		this.state = state;
	}

	getFilePath(): string {
		return `${config.dataPath}/jobs/${this.hash.substring(0, 2)}/${
			this.hash
		}.gcode`;
	}

	async updateFile(sourcePath: string) {
		const filePath = this.getFilePath();
		const dir = path.dirname(filePath);
		await fs.ensureDir(dir);
		await fs.copyFile(sourcePath, filePath);
	}

	async removeFile() {
		const filePath = this.getFilePath();
		await fs.remove(filePath);
	}
}

export enum QueueItemState {
	QUEUED = "queued",
	PRINTING = "printing",
	COMPLETED = "completed",
	FAILED = "failed",
	SENT = "sent",
}

export default {
	Queue,
	QueueItem,
	QueueItemState,
};

interface IQueueItemRow {
	id: number;
	fileName: string;
	hash: string;
	state: QueueItemState;
	idx: number;
}
