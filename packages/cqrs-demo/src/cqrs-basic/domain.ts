// Represents the Note entity/model in our domain
export interface INote {
	id: string;
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

export class Note implements INote {
	constructor(
		public id: string,
		public title: string,
		public content: string,
		public createdAt: Date,
		public updatedAt: Date
	) {}
}
