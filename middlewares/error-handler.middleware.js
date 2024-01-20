export default (err, req, res, next) => {
  console.error(err);
  if (error.name === "ValidationError") {
    return res.status(400).json({ errorMessage: err.message });
  }

  return res
    .status(500)
    .json({ errorMessage: "서버에서 에러가 발생했습니다." }); // 예상하지 못한 에러에 대한 방안
};
