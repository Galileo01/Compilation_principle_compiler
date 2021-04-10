import recognizer from './recognizer';
function test(){
    const tokenList=recognizer(`if(a==3.1)
    {
        b=4;
    }`);
    console.log(tokenList);
    
}
test();