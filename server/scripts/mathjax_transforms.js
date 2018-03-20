let transforms = {
    matrix: text => {
        // parse a matrix template string into [['a','b'],['c','d']] format
        let partitionText = text => {
            let rows = text.split(";");
            return rows.map(row => {
                row = row.trim().replace( /\s\s+/g, ' ' );
                return row.split(" ");
            });
        };

        // iterate, column first, through the matrix
        let iterateMatrix = (matrix, callback) => {
            let numRows = matrix.length;
            let numCols = matrix[0].length;

            for(let c = 0; c < numCols; c++) {
                for(let r = 0; r < numRows; r++) {
                    let value = matrix[r][c];
                    callback(value, r, c);
                }
            }
        }
        
        // does the text have \color{#a38f8c}{12345}?
        let isColored = text => /color/.test(text);

        // getter and setter for the actual value. e.g. 1 or \color{#ffffff}{1} 
        let valueRegex = /{-*\d+}/;
        let getValue = text => {
            if(isColored(text)) {
                return valueRegex.exec(text)[0].replace("{", "").replace("}", "");
            }
            else {
                return text;        
            }
        }

        // how many digits does this number take? e.g. 456 takes 3 digits
        let getDigitCount = text => {
            let isFraction = /frac{/.test(text);
            if(isFraction) {
                /*let fractionParts = text.match(/{\d*}/g);
                let numeratorLength = fractionParts[0].length - 2;
                let denominatorLength = fractionParts[1].length - 2*/
                
                return 1; // 1 seems to look about right
            }
            else {
                return text.match(/(\d|S)/g).length;
            }
        };

        // create a string of n zeroes
        let getDigitString = length => {
            let digitString = "";
            for(let i = 0 ; i < length;  i++) {
                digitString += "0";
            }
            return digitString;
        };

        // toString for the 2d array that is used to represent the matrix
        let matrixToString = matix => {
            matrix = matrix.map(row => {
                return row.join(" & ");
            });
            return matrix.join(" \\\\ \n");
        };
            
        let startsWithNegative = text => {
            var option1 = text.startsWith("-");
            var option2 = text.startsWith("S-");
            return option1 || option2;
        };

        // ACTUALLY START WORKING...
        // Step1: turn the input string into a 2d array
        let matrix = partitionText(text);

        // Step2: find and store the digit that is longest in length in each column
        let digitCounts = [];
        iterateMatrix(matrix, (value, r, c) => {
            value = getValue(value);
            
            let digitCount = getDigitCount(value);
            if(digitCounts.length === c) {
                digitCounts.push(0);
            }
            digitCounts[c] = digitCount > digitCounts[c] ? digitCount : digitCounts[c];
        });

        // Step3: normalize differences in length on a per column basis. e.g. [1;123;1234] => [1\phantom{000};123\phantom{0};1234]
        iterateMatrix(matrix, (value, r, c) => {
            let maxDigitsInColumn = digitCounts[c];
            let digitDifference = maxDigitsInColumn - getDigitCount(value);
            if(digitDifference > 0) {
                let valueWithNormalizedLength = value + "\\phantom{" + getDigitString(digitDifference) + "}";
                matrix[r][c] = valueWithNormalizedLength;
            }
        });

        // Step4: all numbers get a negative sign, even if it's just \phantom{-} so that spacing is consistent.
        // the first column only gets a negative sign if other elements in that column have a negative sign
        let anyNegatives = false;
        iterateMatrix(matrix, (value, r, c) => {
            let isNegative = startsWithNegative(getValue(value));
            anyNegatives = isNegative ? true : anyNegatives;
        });
        if(anyNegatives) {
            iterateMatrix(matrix, (value, r, c) => {
                let isFirstColumn = c === 0;
                let addNegativeToFirstColumn = false;
                if(isFirstColumn) {
                    let anyNegatives = matrix.filter(r => startsWithNegative(r[0])).length > 0;
                    
                    addNegativeToFirstColumn = anyNegatives;
                }
                if(isFirstColumn && addNegativeToFirstColumn === false) {
                    return;
                }
    
                if(startsWithNegative(getValue(value)) === false) {
                    matrix[r][c] = "\\phantom{-}" + value;
                }
            });
        }

        // Step5: special cases
        iterateMatrix(matrix, (value, r, c) => {
            matrix[r][c] = matrix[r][c].replace(/S/, "\\,\\,\\,")
        });

        // Step6: call toString and wrap it in the required syntax for a latex matrix
        let matrixWrapper = "\
            \\( \n\
                \\left[ \n\
                    \\begin{matrix} \n\
                    [MATRIX_LATEX] \n\
                    \\end{matrix} \n\
                \\right] \n\
            \\)";
        
        return matrixWrapper.replace("[MATRIX_LATEX]", matrixToString(matrix));
    }
}

module.exports = {
    matrix: transforms.matrix
};