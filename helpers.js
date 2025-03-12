import { ObjectId } from "mongodb";


export const isProvided = (input) => {
    if (input === null || input === undefined) {
        throw "Input is not provided.";
    }
    return true;
};


export const isValidString = (input) => {
    if(typeof input !== 'string' || input.trim().length === 0)
        throw "Input is not a valid string.";
    
    return input.trim();
};

function isIntegerString(str) {
    return /^-?\d+$/.test(str);
}

export const isValidObjectId = (input) => {
    if(!ObjectId.isValid(input))
        throw "Input is not a valid ObjectId.";
};

export const isValidNumber = (input) => {
    if(typeof input !== 'number' || isNaN(input))
        throw "Input is not a valid number.";
};

export const isValidArray = (input) => {
    if(typeof input !== 'object' || !Array.isArray(input) || input.length === 0){
        throw "Input is not a valid Array.";
    }
};

export const isValidBoolean = (input) => {
    if(typeof input !== 'boolean')
        throw "Input is not a valid Boolean.";
};


