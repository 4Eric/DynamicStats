import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const csvData = `Date,Opponent,Player,AB,R,H,RBI,BB,SO,2B,3B,HR,TB,SB,CS,HBP,SF,E
Jun 7,London Badgers,S Rengel,3,1,1,0,0,0,0,0,0,1,1,0,0,0,0
Jun 7,London Badgers,M Palha,3,1,2,0,0,0,0,1,0,4,0,0,0,0,0
Jun 7,London Badgers,E Mulder,3,1,1,1,0,0,0,0,0,1,0,0,0,0,1
Jun 7,London Badgers,D Reid,3,1,1,0,0,1,0,0,0,1,0,0,0,0,0
Jun 7,London Badgers,C Moran,3,1,1,1,0,1,0,0,0,1,1,0,0,0,0
Jun 7,London Badgers,B Palmer,3,0,0,2,0,2,0,0,0,0,0,0,0,0,0
Jun 7,London Badgers,J Olafson,3,1,2,0,0,0,0,0,0,2,1,0,0,0,1
Jun 7,London Badgers,M Saunders,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Jun 7,London Badgers,N Cai,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
Jun 7,London Badgers,N Shah,2,1,0,0,1,1,0,0,0,0,1,0,0,0,0
Jun 7,London Badgers,E Swantee,1,0,1,2,0,0,0,0,0,1,0,0,0,0,0
Jun 7,London Badgers,M Sturino,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0
Jun 7,Guelph Royals,S Rengel,4,2,4,2,0,0,0,1,1,9,0,0,0,0,0
Jun 7,Guelph Royals,M Palha,3,1,1,0,1,0,0,0,0,1,2,0,0,0,0
Jun 7,Guelph Royals,E Mulder,2,0,1,2,1,1,0,0,0,1,0,0,1,0,0
Jun 7,Guelph Royals,D Reid,4,1,1,0,0,1,1,0,0,2,1,0,0,0,0
Jun 7,Guelph Royals,C Moran,0,1,0,1,0,0,0,0,0,0,0,0,1,0,0
Jun 7,Guelph Royals,E Swantee,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0
Jun 7,Guelph Royals,B Palmer,3,0,0,0,0,2,0,0,0,0,1,0,0,0,0
Jun 7,Guelph Royals,J Olafson,3,1,0,0,0,0,0,0,0,0,0,0,0,0,0
Jun 7,Guelph Royals,M Sturino,2,1,1,0,1,1,0,0,0,1,0,0,0,0,0
Jun 7,Guelph Royals,M Saunders,2,1,1,1,1,0,0,0,0,1,0,0,0,0,0
Jun 7,Guelph Royals,N Cai,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Jun 7,Guelph Royals,N Shah,2,0,1,2,0,1,1,0,0,2,1,0,0,0,0
Jun 6,Wranglers,C Moran,3,2,3,1,0,0,0,0,0,3,1,0,0,0,0
Jun 6,Wranglers,M Palha,2,1,1,1,0,0,0,0,0,1,0,0,0,0,0
Jun 6,Wranglers,S Rengel,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Jun 6,Wranglers,E Mulder,2,0,1,2,0,0,1,0,0,2,0,0,0,0,0
Jun 6,Wranglers,N Cai,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0
Jun 6,Wranglers,D Reid,3,0,1,1,0,1,0,0,0,1,0,0,0,0,0
Jun 6,Wranglers,M Saunders,3,0,2,0,0,0,0,0,0,2,0,0,0,0,1
Jun 6,Wranglers,B Palmer,2,1,1,0,1,0,1,0,0,2,0,0,0,0,0
Jun 6,Wranglers,J Olafson,3,2,1,0,0,0,0,0,0,1,0,0,0,0,0
Jun 6,Wranglers,M Sturino,3,1,2,2,0,0,1,0,0,3,0,0,0,0,0
Jun 6,Wranglers,N Shah,3,1,1,1,0,0,0,0,0,1,0,0,0,0,0
Jun 6,Wranglers,E Swantee,2,1,1,1,0,0,0,0,0,1,0,0,0,0,0
Jun 6,Etobicoke Rangers,S Rengel,3,1,1,1,1,1,0,0,0,1,0,0,0,0,0
Jun 6,Etobicoke Rangers,M Palha,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Jun 6,Etobicoke Rangers,E Mulder,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Jun 6,Etobicoke Rangers,D Reid,2,2,0,0,1,2,0,0,0,0,0,0,0,0,0
Jun 6,Etobicoke Rangers,C Moran,3,2,2,2,0,0,0,0,0,2,2,0,0,0,0
Jun 6,Etobicoke Rangers,B Palmer,1,1,1,2,1,0,0,0,0,1,2,0,1,0,0
Jun 6,Etobicoke Rangers,J Olafson,3,1,1,2,0,0,1,0,0,2,0,0,0,0,0
Jun 6,Etobicoke Rangers,N Shah,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0
Jun 6,Etobicoke Rangers,M Sturino,1,0,0,0,1,1,0,0,0,0,1,0,0,0,0
Jun 6,Etobicoke Rangers,E Swantee,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0
Jun 6,Etobicoke Rangers,M Saunders,2,0,1,1,0,0,1,0,0,2,0,0,0,0,0
Jun 6,Etobicoke Rangers,N Cai,1,1,0,0,2,0,0,0,0,0,1,0,0,0,0
Jun 5,Stratford Nationals,C Moran,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0
Jun 5,Stratford Nationals,E Swantee,2,0,1,0,0,0,0,0,0,1,0,0,0,0,0
Jun 5,Stratford Nationals,M Palha,2,1,1,0,1,0,0,1,0,3,1,0,0,0,0
Jun 5,Stratford Nationals,E Mulder,2,0,1,1,1,0,0,0,0,1,2,0,0,0,0
Jun 5,Stratford Nationals,S Rengel,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0
Jun 5,Stratford Nationals,M Sturino,2,2,1,0,1,1,1,0,0,2,1,0,0,0,0
Jun 5,Stratford Nationals,B Palmer,0,1,0,0,2,0,0,0,0,0,1,0,1,0,0
Jun 5,Stratford Nationals,J Olafson,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0
Jun 5,Stratford Nationals,N Cai,2,0,0,1,0,0,0,0,0,0,1,0,0,0,0
Jun 5,Stratford Nationals,D Reid,2,1,1,2,1,0,0,0,0,1,1,0,0,0,0
Jun 5,Stratford Nationals,M Saunders,2,0,0,0,1,0,0,0,0,0,1,0,0,0,0
Jun 5,Stratford Nationals,N Shah,2,0,0,1,1,0,0,0,0,0,1,0,0,0,0
Jun 3,Halton Hills,M Sturino,3,2,1,1,0,0,1,0,0,2,1,0,1,0,0
Jun 3,Halton Hills,E Mulder,4,0,3,3,0,0,0,1,0,5,1,0,0,0,0
Jun 3,Halton Hills,D Reid,4,0,0,0,0,3,0,0,0,0,0,0,0,0,0
Jun 3,Halton Hills,S Rengel,2,0,1,0,0,0,0,0,0,1,1,0,1,0,0
Jun 3,Halton Hills,M Palha,2,1,1,1,0,0,0,0,0,1,1,0,1,0,0
Jun 3,Halton Hills,B Palmer,2,2,1,0,1,0,1,0,0,2,0,0,0,0,0
Jun 3,Halton Hills,J Olafson,3,1,1,1,0,0,1,0,0,2,2,0,0,0,0
Jun 3,Halton Hills,N Shah,2,1,0,0,1,2,0,0,0,0,0,0,0,0,0
Jun 3,Halton Hills,M Saunders,3,0,2,1,0,0,0,0,0,2,1,0,0,0,0
Jun 3,Halton Hills,C Moran,1,1,1,1,2,0,0,0,0,1,0,0,0,0,0
Jun 3,Halton Hills,N Cai,2,2,0,1,0,0,0,0,0,0,1,0,1,0,0
Jun 3,Halton Hills,E Swantee,3,1,1,1,0,0,1,0,0,2,0,0,0,0,0
May 29,Milton Mets,M Sturino,4,2,2,0,0,1,0,0,0,2,1,0,0,0,1
May 29,Milton Mets,E Mulder,3,2,2,1,1,0,1,0,0,3,1,0,0,0,0
May 29,Milton Mets,D Reid,3,2,2,5,0,0,0,0,2,8,3,0,0,0,0
May 29,Milton Mets,S Rengel,3,2,1,0,0,0,0,0,0,1,0,1,0,0,0
May 29,Milton Mets,M Palha,3,1,2,2,0,0,0,0,0,2,0,0,0,0,0
May 29,Milton Mets,B Palmer,2,0,1,0,1,0,0,0,0,1,0,0,0,0,1
May 29,Milton Mets,J Olafson,3,1,1,1,0,0,1,0,0,2,0,0,0,0,0
May 29,Milton Mets,N Shah,3,0,1,1,0,0,0,0,0,1,0,0,0,0,1
May 29,Milton Mets,M Saunders,3,1,2,0,0,0,0,0,0,2,0,0,0,0,0
May 29,Milton Mets,C Moran,3,1,1,0,0,1,0,0,0,1,1,0,0,0,0
May 29,Milton Mets,N Cai,2,0,0,1,0,0,0,0,0,0,1,0,0,1,0
May 29,Milton Mets,E Swantee,3,0,1,1,0,2,0,0,0,1,0,0,0,0,0
May 28,Burlington Bulls,M Sturino,2,1,2,0,1,0,0,0,0,2,0,1,0,0,0
May 28,Burlington Bulls,E Mulder,2,2,2,0,1,0,1,0,0,3,1,0,0,0,0
May 28,Burlington Bulls,D Reid,2,2,1,2,1,0,1,0,0,2,1,0,0,0,0
May 28,Burlington Bulls,S Rengel,1,3,0,0,2,0,0,0,0,0,1,0,0,0,0
May 28,Burlington Bulls,M Palha,2,3,2,2,1,0,1,0,0,3,0,0,0,0,0
May 28,Burlington Bulls,B Palmer,2,2,1,1,1,1,0,0,0,1,0,0,0,0,0
May 28,Burlington Bulls,J Olafson,3,3,1,3,0,0,1,0,0,2,0,0,0,0,0
May 28,Burlington Bulls,N Shah,2,2,1,2,1,0,0,0,0,1,1,0,0,0,0
May 28,Burlington Bulls,M Saunders,3,0,0,2,0,1,0,0,0,0,0,0,0,0,0
May 28,Burlington Bulls,C Moran,3,0,3,4,0,0,0,0,0,3,0,0,0,0,0
May 28,Burlington Bulls,N Cai,3,0,1,1,0,0,0,0,0,1,0,0,0,0,1
May 28,Burlington Bulls,E Swantee,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 26,Mississauga North,C Moran,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0
May 26,Mississauga North,D Reid,2,1,1,2,1,1,0,0,1,4,0,0,0,0,0
May 26,Mississauga North,M Sturino,3,0,2,0,0,1,1,0,0,3,1,0,0,0,0
May 26,Mississauga North,S Rengel,1,0,0,0,2,1,0,0,0,0,0,0,0,0,0
May 26,Mississauga North,M Palha,2,1,0,0,1,0,0,0,0,0,1,0,0,0,0
May 26,Mississauga North,M Saunders,2,1,0,0,1,1,0,0,0,0,0,0,0,0,0
May 26,Mississauga North,E Mulder,2,2,2,1,1,0,0,0,1,5,0,0,0,0,0
May 26,Mississauga North,J Olafson,3,2,2,3,0,0,1,0,0,3,1,0,0,0,0
May 26,Mississauga North,B Palmer,3,1,1,3,0,0,0,0,1,4,0,0,0,0,0
May 26,Mississauga North,N Shah,2,1,0,0,1,0,0,0,0,0,0,0,0,0,0
May 26,Mississauga North,E Swantee,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 26,Mississauga North,N Cai,3,0,1,0,0,0,0,0,0,1,0,0,0,0,0
May 20,Halton Hills,J Olafson,4,1,1,1,0,0,0,0,0,1,0,0,0,0,0
May 20,Halton Hills,E Mulder,3,2,2,3,0,1,0,0,0,2,1,0,0,0,0
May 20,Halton Hills,M Sturino,2,1,0,0,1,1,0,0,0,0,0,0,0,0,0
May 20,Halton Hills,S Rengel,3,1,1,1,0,0,1,0,0,2,0,0,0,0,0
May 20,Halton Hills,M Palha,3,1,2,3,0,0,1,0,0,3,0,0,0,0,1
May 20,Halton Hills,N Shah,2,1,0,0,1,0,0,0,0,0,1,0,0,0,0
May 20,Halton Hills,M Saunders,2,1,0,0,1,0,0,0,0,0,1,0,0,0,0
May 20,Halton Hills,B Palmer,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0
May 20,Halton Hills,C Moran,2,1,0,0,1,1,0,0,0,0,0,0,0,0,0
May 20,Halton Hills,E Swantee,2,1,0,1,1,0,0,0,0,0,0,0,0,0,0
May 20,Halton Hills,N Cai,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 20,Halton Hills,D Reid,1,2,1,0,2,0,0,0,0,1,0,0,0,0,0
May 17,Scarborough Stingers,S Rengel,5,2,4,2,0,0,1,0,0,5,2,0,0,0,0
May 17,Scarborough Stingers,M Saunders,1,2,0,1,2,0,0,0,0,0,0,0,0,1,0
May 17,Scarborough Stingers,M Sturino,2,2,1,0,1,0,0,0,0,1,0,0,1,0,0
May 17,Scarborough Stingers,D Reid,3,2,2,1,1,1,0,0,0,2,2,0,0,0,0
May 17,Scarborough Stingers,M Palha,2,1,1,3,1,0,0,0,0,1,1,0,0,1,0
May 17,Scarborough Stingers,E Mulder,4,0,2,2,0,0,0,0,0,2,2,0,0,0,0
May 17,Scarborough Stingers,J Olafson,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0
May 17,Scarborough Stingers,E Swantee,3,0,1,1,0,1,0,0,0,1,0,0,0,0,0
May 17,Scarborough Stingers,B Palmer,4,0,0,0,0,1,0,0,0,0,0,0,0,0,0
May 17,Scarborough Stingers,N Shah,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0
May 17,Scarborough Stingers,C Moran,2,2,1,0,0,0,0,0,0,1,0,0,0,0,0
May 17,Scarborough Stingers,N Cai,3,2,2,0,1,1,0,0,0,2,1,0,0,0,0
May 17,Mississauga North,S Rengel,3,1,1,0,1,0,0,0,0,1,2,0,0,0,0
May 17,Mississauga North,M Saunders,2,0,0,0,0,2,0,0,0,0,0,0,0,0,0
May 17,Mississauga North,C Moran,1,1,1,1,1,0,0,0,0,1,1,0,0,0,0
May 17,Mississauga North,M Sturino,3,0,2,1,1,0,0,1,0,4,1,0,0,0,0
May 17,Mississauga North,D Reid,2,0,0,0,2,2,0,0,0,0,1,0,0,0,0
May 17,Mississauga North,M Palha,4,1,2,0,0,0,0,0,0,2,1,1,0,0,0
May 17,Mississauga North,E Mulder,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0
May 17,Mississauga North,J Olafson,3,0,1,1,0,1,0,0,0,1,0,0,0,0,0
May 17,Mississauga North,B Palmer,1,0,0,0,2,1,0,0,0,0,0,0,0,0,1
May 17,Mississauga North,N Shah,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0
May 17,Mississauga North,E Swantee,2,0,0,0,0,2,0,0,0,0,0,0,0,0,1
May 17,Mississauga North,N Cai,2,0,0,0,1,1,0,0,0,0,0,1,0,0,0
May 16,Newmarket,M Saunders,3,1,1,1,0,1,0,0,0,1,1,0,0,0,0
May 16,Newmarket,M Sturino,2,2,1,1,1,0,1,0,0,2,1,0,0,0,1
May 16,Newmarket,D Reid,2,1,1,0,0,0,0,0,0,1,3,0,0,0,0
May 16,Newmarket,E Mulder,1,1,1,2,0,0,0,0,0,1,2,0,0,0,0
May 16,Newmarket,M Palha,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 16,Newmarket,S Rengel,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1
May 16,Newmarket,J Olafson,2,0,0,0,1,0,0,0,0,0,1,0,0,0,1
May 16,Newmarket,B Palmer,3,1,0,0,0,1,0,0,0,0,0,0,0,0,0
May 16,Newmarket,N Shah,2,1,1,1,0,0,0,1,0,3,0,0,0,0,0
May 16,Newmarket,E Swantee,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 16,Newmarket,N Cai,2,1,2,1,0,0,0,0,0,2,3,0,0,0,0
May 16,Newmarket,C Moran,0,1,0,0,2,0,0,0,0,0,2,0,0,0,0
May 15,Scarborough Stingers,S Rengel,3,1,1,1,0,0,0,0,0,1,0,0,0,0,0
May 15,Scarborough Stingers,M Saunders,2,1,1,0,0,1,1,0,0,2,2,0,1,0,0
May 15,Scarborough Stingers,D Reid,1,1,0,1,2,0,0,0,0,0,2,0,0,0,1
May 15,Scarborough Stingers,M Palha,1,0,0,2,1,0,0,0,0,0,0,0,0,1,0
May 15,Scarborough Stingers,J Olafson,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0
May 15,Scarborough Stingers,E Mulder,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1
May 15,Scarborough Stingers,B Palmer,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1
May 15,Scarborough Stingers,M Sturino,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 15,Scarborough Stingers,C Moran,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0
May 15,Scarborough Stingers,N Shah,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0
May 15,Scarborough Stingers,N Cai,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 15,Scarborough Stingers,E Swantee,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0
May 13,Brampton Royals,S Rengel,2,3,2,1,1,0,0,0,0,2,0,0,0,0,0
May 13,Brampton Royals,M Saunders,2,1,1,0,1,0,0,0,0,1,0,0,0,0,0
May 13,Brampton Royals,B Palmer,2,2,2,3,0,0,1,0,0,3,1,0,0,0,1
May 13,Brampton Royals,D Reid,2,2,2,1,0,0,0,0,0,2,0,0,1,0,0
May 13,Brampton Royals,M Palha,2,2,2,3,1,0,0,1,0,4,0,0,0,0,0
May 13,Brampton Royals,J Olafson,2,1,1,2,1,0,0,0,0,1,0,0,0,0,1
May 13,Brampton Royals,E Mulder,1,1,0,2,1,0,0,0,0,0,1,0,0,0,0
May 13,Brampton Royals,N Cai,3,0,1,2,0,0,0,0,0,1,0,0,0,0,0
May 13,Brampton Royals,N Shah,1,2,0,0,2,0,0,0,0,0,0,0,0,0,0
May 13,Brampton Royals,E Swantee,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0
May 13,Brampton Royals,M Sturino,1,1,0,0,1,0,0,0,0,0,0,0,0,0,1
May 13,Brampton Royals,C Moran,1,2,1,2,1,0,0,0,0,1,0,0,0,0,1
May 11,Oakville,S Rengel,4,1,2,0,0,0,0,0,0,2,0,0,0,0,0
May 11,Oakville,M Saunders,3,0,1,0,0,0,0,0,0,1,0,0,0,0,1
May 11,Oakville,B Palmer,3,0,0,0,0,1,0,0,0,0,0,0,0,0,0
May 11,Oakville,M Palha,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0
May 11,Oakville,M Sturino,2,0,0,1,1,0,0,0,0,0,0,0,0,0,0
May 11,Oakville,E Swantee,3,0,1,0,0,0,0,0,0,1,0,0,0,0,0
May 11,Oakville,E Mulder,3,1,1,0,0,0,1,0,0,2,0,0,0,0,0
May 11,Oakville,N Shah,3,0,0,0,0,0,0,0,0,0,1,0,0,0,0
May 11,Oakville,N Cai,3,1,1,1,0,0,0,0,0,1,1,0,0,0,0
May 11,Oakville,C Moran,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 6,Mississauga North,S Rengel,3,0,0,0,0,1,0,0,0,0,0,0,0,0,0
May 6,Mississauga North,M Saunders,1,1,0,0,0,1,0,0,0,0,1,0,2,0,0
May 6,Mississauga North,B Palmer,3,1,1,2,0,0,1,0,0,2,0,0,0,0,0
May 6,Mississauga North,D Reid,2,0,0,1,0,2,0,0,0,0,0,0,0,1,0
May 6,Mississauga North,M Palha,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 6,Mississauga North,J Olafson,3,0,1,0,0,1,0,0,0,1,0,0,0,0,0
May 6,Mississauga North,E Mulder,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 6,Mississauga North,N Cai,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 6,Mississauga North,N Shah,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0
May 6,Mississauga North,E Swantee,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0
May 6,Mississauga North,M Sturino,2,1,1,1,0,0,0,0,0,1,0,0,0,0,0
May 6,Mississauga North,C Moran,0,1,0,0,2,0,0,0,0,0,0,0,0,0,0
May 5,Brampton Royals,S Rengel,3,2,2,0,0,1,0,1,0,4,0,0,0,0,0
May 5,Brampton Royals,M Sturino,2,2,1,0,1,0,0,1,0,3,3,0,0,0,1
May 5,Brampton Royals,M Saunders,1,2,1,0,2,0,0,0,0,1,2,0,0,0,0
May 5,Brampton Royals,B Palmer,2,3,1,1,1,0,0,0,0,1,2,0,0,0,0
May 5,Brampton Royals,D Reid,3,0,0,2,0,0,0,0,0,0,0,0,0,0,0
May 5,Brampton Royals,M Palha,3,0,1,1,0,1,0,0,0,1,0,0,0,0,0
May 5,Brampton Royals,J Olafson,0,2,0,0,2,0,0,0,0,0,1,0,1,0,0
May 5,Brampton Royals,E Mulder,3,0,2,2,0,0,1,0,0,3,1,0,0,0,0
May 5,Brampton Royals,N Cai,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0
May 5,Brampton Royals,N Shah,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 5,Brampton Royals,E Swantee,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 5,Brampton Royals,C Moran,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 2,Etobicoke Rangers,M Saunders,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0
May 2,Etobicoke Rangers,B Palmer,4,1,1,0,0,0,0,0,0,1,0,1,0,0,1
May 2,Etobicoke Rangers,D Reid,2,2,2,1,2,0,1,0,0,3,1,0,0,0,0
May 2,Etobicoke Rangers,E Mulder,3,1,2,1,1,0,1,0,0,3,1,0,0,0,1
May 2,Etobicoke Rangers,J Olafson,4,1,1,0,0,1,0,0,0,1,0,0,0,0,1
May 2,Etobicoke Rangers,N Shah,3,2,2,1,0,0,0,0,0,2,0,0,0,0,0
May 2,Etobicoke Rangers,N Cai,2,2,0,0,1,0,0,0,0,0,2,0,0,0,0
May 2,Etobicoke Rangers,M Sturino,1,3,1,0,2,0,0,0,0,1,1,0,0,0,0
May 2,Etobicoke Rangers,E Swantee,3,1,2,3,0,0,0,0,0,2,2,0,0,0,0
May 2,Etobicoke Rangers,C Moran,2,0,0,0,1,0,0,0,0,0,1,0,0,0,0
May 2,Etobicoke Rangers,S Rengel,2,0,0,2,1,0,0,0,0,0,0,0,0,0,0`;

async function importCSV() {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  
  const playersMap = new Map();
  const gamesMap = new Map();
  const battingLines = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const date = cols[0];
    const opponent = cols[1];
    const playerName = cols[2];
    
    // Auto generate player if not exists
    if (!playersMap.has(playerName)) {
      playersMap.set(playerName, {
        id: crypto.randomUUID(),
        name: playerName,
        number: 0,
        positions: []
      });
    }
    const player = playersMap.get(playerName);

    // Auto generate game if not exists
    const gameKey = date + opponent;
    if (!gamesMap.has(gameKey)) {
      gamesMap.set(gameKey, {
        id: crypto.randomUUID(),
        date: new Date(date + ' 2026').toISOString().split('T')[0], // parse as current year
        opponent: opponent,
        ourScore: 0,
        opponentScore: 0,
        result: 'W',
        gameNumber: gamesMap.size + 1
      });
    }
    const game = gamesMap.get(gameKey);

    // AB,R,H,RBI,BB,SO,2B,3B,HR,TB,SB,CS,HBP,SF,E
    const ab = parseInt(cols[3], 10);
    const r = parseInt(cols[4], 10);
    const h = parseInt(cols[5], 10);
    const rbi = parseInt(cols[6], 10);
    const bb = parseInt(cols[7], 10);
    const so = parseInt(cols[8], 10);
    const doubles = parseInt(cols[9], 10);
    const triples = parseInt(cols[10], 10);
    const hr = parseInt(cols[11], 10);
    const tb = parseInt(cols[12], 10);
    const sb = parseInt(cols[13], 10);
    const cs = parseInt(cols[14], 10);
    const hbp = parseInt(cols[15], 10);
    const sf = parseInt(cols[16], 10);
    const e = parseInt(cols[17], 10);

    battingLines.push({
      gameId: game.id,
      playerId: player.id,
      AB: ab,
      R: r,
      H: h,
      RBI: rbi,
      BB: bb,
      SO: so,
      doubles: doubles,
      triples: triples,
      HR: hr,
      TB: tb,
      SB: sb,
      CS: cs,
      HBP: hbp,
      E: e
    });
  }

  const playersArr = Array.from(playersMap.values());
  const gamesArr = Array.from(gamesMap.values());

  const dataDir = path.join(__dirname, '../../data');
  await fs.writeFile(path.join(dataDir, 'players.json'), JSON.stringify(playersArr, null, 2));
  await fs.writeFile(path.join(dataDir, 'games.json'), JSON.stringify(gamesArr, null, 2));
  await fs.writeFile(path.join(dataDir, 'batting.json'), JSON.stringify(battingLines, null, 2));
  await fs.writeFile(path.join(dataDir, 'pitching.json'), JSON.stringify([], null, 2)); // clear pitching

  console.log('Import successful!');
}

importCSV().catch(console.error);
