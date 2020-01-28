import { databaseURL, DBName } from '../config/config';
import * as mongoose from 'mongoose';

// When Successfully Connected to database

mongoose.connect(`${databaseURL}${DBName}`, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false });

mongoose.Promise = global.Promise;

mongoose.connection.on('connected', () => {
    console.log('Database is now connected!');
});


// On error in database connection
mongoose.connection.on('error', (error) => {
    console.log('Error in Database connection', error);
});