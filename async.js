const sleep = ms => new Promise(resolve => setTimeout(() => resolve(1), ms));

const logAfterTwoSeconds = async () => {
  const result = await sleep(2000);
  console.log(result);
}

logAfterTwoSeconds();