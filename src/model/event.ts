export interface IEvent {
  origin: string;
  id: string;

  url?: string;
  title?: string;
  subtitle?: string;

  tags?: string[];
  categories?: string[];

  info?: string;
  locations?: string[];
  ageLimit?: string;

  date?: string;
  dateUnix: number;
  time?: string;
  entryTime?: string;

  ticketLink?: string;
  price?: string;

  images?: string[];
}
