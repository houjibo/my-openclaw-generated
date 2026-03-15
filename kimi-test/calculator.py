"""
一个简单的Python计算器类，支持加减乘除运算。
包含完整的类型提示和异常处理。
"""

from typing import Union

# 定义数字类型别名
Number = Union[int, float]


class CalculatorError(Exception):
    """计算器自定义异常基类"""
    pass


class DivisionByZeroError(CalculatorError):
    """除零错误"""
    pass


class InvalidInputError(CalculatorError):
    """无效输入错误"""
    pass


class Calculator:
    """
    简单的计算器类，支持基本的加减乘除运算。
    
    示例:
        >>> calc = Calculator()
        >>> calc.add(1, 2)
        3
        >>> calc.divide(10, 2)
        5.0
    """

    @staticmethod
    def _validate_inputs(a: Number, b: Number) -> None:
        """
        验证输入是否为数字类型。
        
        Args:
            a: 第一个操作数
            b: 第二个操作数
            
        Raises:
            InvalidInputError: 当输入不是数字类型时抛出
        """
        if not isinstance(a, (int, float)):
            raise InvalidInputError(f"第一个参数必须是数字类型，收到: {type(a).__name__}")
        if not isinstance(b, (int, float)):
            raise InvalidInputError(f"第二个参数必须是数字类型，收到: {type(b).__name__}")

    def add(self, a: Number, b: Number) -> Number:
        """
        加法运算。
        
        Args:
            a: 被加数
            b: 加数
            
        Returns:
            两数之和
            
        Raises:
            InvalidInputError: 当输入不是数字类型时抛出
        """
        self._validate_inputs(a, b)
        return a + b

    def subtract(self, a: Number, b: Number) -> Number:
        """
        减法运算。
        
        Args:
            a: 被减数
            b: 减数
            
        Returns:
            两数之差
            
        Raises:
            InvalidInputError: 当输入不是数字类型时抛出
        """
        self._validate_inputs(a, b)
        return a - b

    def multiply(self, a: Number, b: Number) -> Number:
        """
        乘法运算。
        
        Args:
            a: 被乘数
            b: 乘数
            
        Returns:
            两数之积
            
        Raises:
            InvalidInputError: 当输入不是数字类型时抛出
        """
        self._validate_inputs(a, b)
        return a * b

    def divide(self, a: Number, b: Number) -> float:
        """
        除法运算。
        
        Args:
            a: 被除数
            b: 除数
            
        Returns:
            两数之商（浮点数）
            
        Raises:
            InvalidInputError: 当输入不是数字类型时抛出
            DivisionByZeroError: 当除数为零时抛出
        """
        self._validate_inputs(a, b)
        if b == 0:
            raise DivisionByZeroError("除数不能为零")
        return a / b

    def safe_divide(self, a: Number, b: Number, default: float = 0.0) -> float:
        """
        安全的除法运算，除零时返回默认值而不是抛出异常。
        
        Args:
            a: 被除数
            b: 除数
            default: 除零时的默认返回值
            
        Returns:
            两数之商，或默认值（当除数为零时）
            
        Raises:
            InvalidInputError: 当输入不是数字类型时抛出
        """
        self._validate_inputs(a, b)
        if b == 0:
            return default
        return a / b


def main() -> None:
    """示例用法"""
    calc = Calculator()

    print("=== 计算器示例 ===\n")

    # 基本运算示例
    print("基本运算:")
    print(f"10 + 5 = {calc.add(10, 5)}")
    print(f"10 - 5 = {calc.subtract(10, 5)}")
    print(f"10 * 5 = {calc.multiply(10, 5)}")
    print(f"10 / 5 = {calc.divide(10, 5)}")

    # 浮点数运算
    print("\n浮点数运算:")
    print(f"3.14 + 2.86 = {calc.add(3.14, 2.86)}")
    print(f"7.5 / 2.5 = {calc.divide(7.5, 2.5)}")

    # 安全除法
    print("\n安全除法:")
    print(f"10 / 0 (safe) = {calc.safe_divide(10, 0, default=float('inf'))}")

    # 异常处理示例
    print("\n异常处理示例:")
    
    try:
        calc.divide(10, 0)
    except DivisionByZeroError as e:
        print(f"除零错误: {e}")

    try:
        calc.add("10", 5)
    except InvalidInputError as e:
        print(f"输入错误: {e}")

    print("\n=== 示例结束 ===")


if __name__ == "__main__":
    main()
